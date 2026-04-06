const { DataTypes } = require("sequelize");
const {
  cloneBusinessConfigDefaults,
} = require("../constants/businessConfigDefaults");

module.exports = (sequelize) => {
  sequelize.define(
    "businessConfig",
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      logo: {
        type: DataTypes.JSONB,
        allowNull: true,
        defaultValue: null,
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "HALLPA",
      },
      businessTagline: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "marroquineria con identidad",
      },
      whatsapp: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "5493855015327",
      },
      supportEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "hola@hallpa.com",
      },
      legalEmail: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "legal@hallpa.com",
      },
      contactAddress: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Argentina",
      },
      footerText: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "Atencion personalizada, compra protegida y una experiencia lista para crecer con tu marca.",
      },
      homeHeroBadge: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Marca blanca lista para vender",
      },
      homeHeroTitle: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "HALLPA combina identidad, experiencia de compra clara y una presencia visual mas fuerte.",
      },
      homeHeroDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "Configura logo, nombre comercial, textos clave y contenidos institucionales desde el panel administrador para adaptar la tienda a cada negocio.",
      },
      homeStoryTitle: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Una marca con relato, no solo con productos",
      },
      homeStoryDescription: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "La tienda puede contar su propia historia, reforzar su propuesta de valor y mantener consistencia en cada punto de contacto.",
      },
      homeStoryQuote: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue:
          "Cada negocio necesita una identidad clara, una narrativa propia y una operacion lista para escalar.",
      },
      homeStoryAuthor: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "Equipo fundador",
      },
      shippingPolicySections: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: cloneBusinessConfigDefaults().shippingPolicySections,
      },
      returnPolicySections: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: cloneBusinessConfigDefaults().returnPolicySections,
      },
      paymentsPolicySections: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: cloneBusinessConfigDefaults().paymentsPolicySections,
      },
      termsSections: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: cloneBusinessConfigDefaults().termsSections,
      },
      privacySections: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: cloneBusinessConfigDefaults().privacySections,
      },
      faqItems: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: cloneBusinessConfigDefaults().faqItems,
      },
      historySections: {
        type: DataTypes.JSONB,
        allowNull: false,
        defaultValue: cloneBusinessConfigDefaults().historySections,
      },
    },
    {
      timestamps: true,
    }
  );
};
