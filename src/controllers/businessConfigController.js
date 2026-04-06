const fs = require("fs-extra");
const { BusinessConfig } = require("../db");
const { uploadImage, deleteImage } = require("../utils/cloudinary");
const {
  cloneBusinessConfigDefaults,
} = require("../constants/businessConfigDefaults");

const SINGLETON_ID = 1;

const normalizeString = (value, fallback = "") =>
  typeof value === "string" ? value.trim() : fallback;

const normalizeSectionList = (value, fallback = []) => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .map((item) => ({
      title: normalizeString(item?.title),
      content: normalizeString(item?.content),
    }))
    .filter((item) => item.title || item.content);

  return normalized.length ? normalized : fallback;
};

const normalizeFaqItems = (value, fallback = []) => {
  if (!Array.isArray(value)) {
    return fallback;
  }

  const normalized = value
    .map((item) => ({
      question: normalizeString(item?.question),
      answer: normalizeString(item?.answer),
    }))
    .filter((item) => item.question || item.answer);

  return normalized.length ? normalized : fallback;
};

const buildBusinessConfigPayload = (payload = {}, currentConfig = null) => {
  const defaults = cloneBusinessConfigDefaults();

  return {
    businessName:
      normalizeString(payload.businessName, currentConfig?.businessName) ||
      defaults.businessName,
    businessTagline:
      normalizeString(payload.businessTagline, currentConfig?.businessTagline) ||
      defaults.businessTagline,
    whatsapp:
      normalizeString(payload.whatsapp, currentConfig?.whatsapp) ||
      defaults.whatsapp,
    supportEmail:
      normalizeString(payload.supportEmail, currentConfig?.supportEmail) ||
      defaults.supportEmail,
    legalEmail:
      normalizeString(payload.legalEmail, currentConfig?.legalEmail) ||
      defaults.legalEmail,
    contactAddress:
      normalizeString(payload.contactAddress, currentConfig?.contactAddress) ||
      defaults.contactAddress,
    footerText:
      normalizeString(payload.footerText, currentConfig?.footerText) ||
      defaults.footerText,
    homeHeroBadge:
      normalizeString(payload.homeHeroBadge, currentConfig?.homeHeroBadge) ||
      defaults.homeHeroBadge,
    homeHeroTitle:
      normalizeString(payload.homeHeroTitle, currentConfig?.homeHeroTitle) ||
      defaults.homeHeroTitle,
    homeHeroDescription:
      normalizeString(
        payload.homeHeroDescription,
        currentConfig?.homeHeroDescription
      ) || defaults.homeHeroDescription,
    homeStoryTitle:
      normalizeString(payload.homeStoryTitle, currentConfig?.homeStoryTitle) ||
      defaults.homeStoryTitle,
    homeStoryDescription:
      normalizeString(
        payload.homeStoryDescription,
        currentConfig?.homeStoryDescription
      ) || defaults.homeStoryDescription,
    homeStoryQuote:
      normalizeString(payload.homeStoryQuote, currentConfig?.homeStoryQuote) ||
      defaults.homeStoryQuote,
    homeStoryAuthor:
      normalizeString(payload.homeStoryAuthor, currentConfig?.homeStoryAuthor) ||
      defaults.homeStoryAuthor,
    shippingPolicySections: normalizeSectionList(
      payload.shippingPolicySections,
      currentConfig?.shippingPolicySections || defaults.shippingPolicySections
    ),
    returnPolicySections: normalizeSectionList(
      payload.returnPolicySections,
      currentConfig?.returnPolicySections || defaults.returnPolicySections
    ),
    paymentsPolicySections: normalizeSectionList(
      payload.paymentsPolicySections,
      currentConfig?.paymentsPolicySections || defaults.paymentsPolicySections
    ),
    termsSections: normalizeSectionList(
      payload.termsSections,
      currentConfig?.termsSections || defaults.termsSections
    ),
    privacySections: normalizeSectionList(
      payload.privacySections,
      currentConfig?.privacySections || defaults.privacySections
    ),
    faqItems: normalizeFaqItems(
      payload.faqItems,
      currentConfig?.faqItems || defaults.faqItems
    ),
    historySections: normalizeSectionList(
      payload.historySections,
      currentConfig?.historySections || defaults.historySections
    ),
  };
};

const ensureBusinessConfig = async () => {
  const defaults = cloneBusinessConfigDefaults();

  const [config] = await BusinessConfig.findOrCreate({
    where: { id: SINGLETON_ID },
    defaults: {
      id: SINGLETON_ID,
      ...defaults,
    },
  });

  return config;
};

const mapBusinessConfig = (config) => {
  if (!config) {
    return cloneBusinessConfigDefaults();
  }

  return {
    id: config.id,
    logo: config.logo || null,
    businessName: config.businessName,
    businessTagline: config.businessTagline,
    whatsapp: config.whatsapp,
    supportEmail: config.supportEmail,
    legalEmail: config.legalEmail,
    contactAddress: config.contactAddress,
    footerText: config.footerText,
    homeHeroBadge: config.homeHeroBadge,
    homeHeroTitle: config.homeHeroTitle,
    homeHeroDescription: config.homeHeroDescription,
    homeStoryTitle: config.homeStoryTitle,
    homeStoryDescription: config.homeStoryDescription,
    homeStoryQuote: config.homeStoryQuote,
    homeStoryAuthor: config.homeStoryAuthor,
    shippingPolicySections: config.shippingPolicySections || [],
    returnPolicySections: config.returnPolicySections || [],
    paymentsPolicySections: config.paymentsPolicySections || [],
    termsSections: config.termsSections || [],
    privacySections: config.privacySections || [],
    faqItems: config.faqItems || [],
    historySections: config.historySections || [],
  };
};

const getBusinessConfigRecord = async () => ensureBusinessConfig();

const getBusinessConfig = async (req, res) => {
  try {
    const config = await ensureBusinessConfig();
    return res.status(200).json(mapBusinessConfig(config));
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

const updateBusinessConfig = async (req, res) => {
  let logoFile = req.files?.logo;

  if (Array.isArray(logoFile)) {
    [logoFile] = logoFile;
  }

  try {
    const currentConfig = await ensureBusinessConfig();
    const rawPayload =
      typeof req.body.data === "string" ? JSON.parse(req.body.data) : req.body;
    const nextPayload = buildBusinessConfigPayload(rawPayload, currentConfig);

    if (logoFile?.tempFilePath) {
      const uploadedLogo = await uploadImage(logoFile.tempFilePath);

      if (currentConfig.logo?.public_id) {
        await deleteImage(currentConfig.logo.public_id);
      }

      nextPayload.logo = {
        public_id: uploadedLogo.public_id,
        secure_url: uploadedLogo.secure_url,
      };

      await fs.remove(logoFile.tempFilePath);
    }

    await currentConfig.update(nextPayload);

    return res.status(200).json(mapBusinessConfig(currentConfig));
  } catch (error) {
    if (logoFile?.tempFilePath) {
      await fs.remove(logoFile.tempFilePath).catch(() => null);
    }

    return res.status(400).json({ error: error.message });
  }
};

module.exports = {
  SINGLETON_ID,
  ensureBusinessConfig,
  mapBusinessConfig,
  getBusinessConfigRecord,
  getBusinessConfig,
  updateBusinessConfig,
};
