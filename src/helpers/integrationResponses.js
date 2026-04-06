const buildPendingIntegrationResponse = ({
  domain,
  provider,
  action,
  payload = null,
  requiredFields = [],
  examplePayload = null,
  nextSteps = [],
  notes = [],
}) => ({
  implemented: false,
  domain,
  provider,
  action,
  message: "Ruta preparada. Falta conectar el servicio externo y persistencia final.",
  payloadReceived: payload,
  requiredFields,
  examplePayload,
  nextSteps,
  notes,
});

const normalizeProviderCode = (provider = "") =>
  provider.toString().trim().toLowerCase();

const ensureSupportedProvider = (provider, supportedProviders = []) => {
  const normalizedProvider = normalizeProviderCode(provider);

  return supportedProviders.find(
    (item) => normalizeProviderCode(item.code) === normalizedProvider
  );
};

module.exports = {
  buildPendingIntegrationResponse,
  normalizeProviderCode,
  ensureSupportedProvider,
};
