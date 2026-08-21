const {
  findTenantBySlug,
  createReport,
  getReportsByTenant,
  getReportById,
  updateReportStatus,
  updateReportAiCategory,
  getOpenReportsByTenant,
  markReportAsDuplicate,
  getReportByTrackingToken,
} = require("./reports.queries");

const { incrementTenantAiCredits } = require("../tenant/tenant.queries");

const { getIO } = require("../../socket/socket");

const crypto = require("crypto");
const { categorizeReport, findDuplicateReport } = require("./gemini.service");

const submitReport = async (req, res) => {
  const { slug } = req.params;
  const tenant = await findTenantBySlug(slug);
  if (!tenant) {
    return res.status(404).json({ error: "Company not found" });
  }
  const { title, description, category, submitterName, submitterEmail } =
    req.body;
  if (!title) {
    return res.status(400).json({ error: "invalid credentials" });
  }
  const trackingToken = crypto.randomBytes(32).toString("hex");
  const report = await createReport({
    tenantId: tenant.id,
    title,
    description,
    category,
    submitterName,
    submitterEmail,
    trackingToken,
  });

  getIO()
    .to(`tenant-${tenant.id}`)
    .emit("activity", {
      type: "report_submitted",
      message: `New report submitted: "${report.title}"`,
      data: { reportId: report.id, submitterName: report.submitter_name },
      timestamp: new Date().toISOString(),
    });

  if (tenant.ai_credits_used < tenant.ai_credits_limit) {
    getOpenReportsByTenant(tenant.id, report.id).then((existingReports) => {
      Promise.all([
        categorizeReport(title, description),
        findDuplicateReport(title, description, existingReports),
      ])
        .then(([aiCategory, duplicateOfId]) => {
          updateReportAiCategory(report.id, aiCategory);
          if (duplicateOfId) {
            markReportAsDuplicate(report.id, duplicateOfId);
          }
          incrementTenantAiCredits(tenant.id);
        })
        .catch((err) => console.error("AI processing failed:", err));
    });
  }
  return res.status(201).json(report);
};

const getReports = async (req, res) => {
  const tenantId = req.user.tenantId;
  const reports = await getReportsByTenant(tenantId);
  return res.status(200).json(reports);
};

const getReport = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  const report = await getReportById(id, tenantId);
  if (!report) {
    return res.status(404).json({ error: "invalid or no report" });
  }
  return res.status(200).json(report);
};

const getReportByToken = async (req, res) => {
  const trackingToken = req.params.tracking_token;
  const report = await getReportByTrackingToken(trackingToken);
  if (!report) {
    return res.status(404).json({ error: "invalid or no report" });
  }
  return res.status(200).json(report);
};

const updateReport = async (req, res) => {
  const { id } = req.params;
  const tenantId = req.user.tenantId;
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: "Missing field" });
  }
  const report = await updateReportStatus(id, tenantId, status);
  if (!report) {
    return res.status(404).json({ error: "invalid or no report" });
  }

  getIO().to(`tenant-${tenantId}`).emit("report-status-updated", report);

  getIO()
    .to(`tenant-${tenantId}`)
    .emit("activity", {
      type: "report_status_updated",
      message: `"${report.title}" status changed to ${report.status}`,
      data: { reportId: report.id, status: report.status },
      timestamp: new Date().toISOString(),
    });

    getIO().to(`track-${report.tracking_token}`).emit('report-status-updated', report);

  return res.status(200).json(report);
};

module.exports = { submitReport, getReports, getReport, updateReport, getReportByToken };