import express from "express";
import ContactController from "../../controller/contactController.js";
import Joi from "joi";
import "../../passport.js";
import AuthController from "../../controller/authController.js";
import { STATUS_CODES } from "../../utils/constants.js";

const router = express.Router();

function checkPhone(value) {
  return /^(\(\d{3}\)\s\d{3}-\d{4})$/.test(value);
}

const addSchema = Joi.object({
  name: Joi.string().required(),
  email: Joi.string().email().required(),
  phone: Joi.string()
    .custom((value, helpers) => {
      if (!checkPhone(value)) {
        return helpers.message(
          "Please enter a phone number in the format (XXX) XXX-XXXX"
        );
      }
      return value;
    })
    .required(),
  favorite: Joi.boolean(),
});

const updateSchema = Joi.object({
  name: Joi.string(),
  email: Joi.string().email(),
  phone: Joi.string().custom((value, helpers) => {
    if (!checkPhone(value)) {
      return helpers.message(
        "Please enter a phone number in the format (XXX) XXX-XXXX"
      );
    }
    return value;
  }),
  favorite: Joi.boolean(),
}).min(1);

const updateFavoriteSchema = Joi.object({
  favorite: Joi.boolean().required(),
});

function validateId(req, res, next) {
  const { contactId } = req.params;
  if (!isValidObjectId(contactId)) {
    return res.status(STATUS_CODES.notFound).json({
      status: "error",
      message: "Invalid contact ID",
      data: "not Found",
    });
  }
  next();
}

function validateBody(schema) {
  return (req, res, next) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({ error: error.details[0].message });
    }
    next();
  };
}

// GET localhost:3000/api/contacts
router.get("/", AuthController.validateAuth, async (req, res) => {
  try {
    const contacts = await ContactController.listContacts();

    res.status(STATUS_CODES.success).json({
      message: "Lista a fost returnată cu succes",
      data: contacts,
    });
  } catch (error) {
    respondWithError(res, error);
  }
});

router.get("/:contactId", async (req, res) => {
  try {
    const contact = await ContactController.getContactById(
      req.params.contactId
    );
    if (!contact) {
      return res.status(STATUS_CODES.notFound).json({
        message: "Contactul nu a fost găsit",
      });
    }
    res.status(STATUS_CODES.success).json({
      message: "Contactul a fost returnat cu succes",
      data: contact,
    });
  } catch (error) {
    respondWithError(res, error);
  }
});

router.post("/", validateBody(addSchema), async (req, res) => {
  try {
    const contact = await ContactController.addContact(req.body);
    res.status(STATUS_CODES.created).json({
      message: `Contactul ${contact.name} a fost adăugat cu succes.`,
      data: contact,
    });
  } catch (error) {
    respondWithError(res, error);
  }
});

router.put(
  "/:contactId",
  validateId,
  validateBody(updateSchema),
  async (req, res) => {
    try {
      const updatedContact = await ContactController.updateContact(
        req.body,
        req.params.contactId
      );
      if (!updatedContact) {
        return res.status(STATUS_CODES.notFound).json({
          message: "Contactul nu a fost găsit",
        });
      }
      res.status(STATUS_CODES.success).json({
        message: "Contactul a fost actualizat cu succes",
        data: updatedContact,
      });
    } catch (error) {
      respondWithError(res, error);
    }
  }
);

router.delete("/:contactId", validateId, async (req, res) => {
  try {
    const removedContact = await ContactController.removeContact(
      req.params.contactId
    );
    if (!removedContact) {
      return res.status(STATUS_CODES.notFound).json({
        message: "Contactul nu a fost găsit",
      });
    }
    res.status(STATUS_CODES.deleted).json({
      message: "Contactul a fost șters cu succes",
    });
  } catch (error) {
    respondWithError(res, error);
  }
});

router.patch(
  "/:contactId/favorite",
  validateId,
  validateBody(updateFavoriteSchema),
  async (req, res) => {
    try {
      const { contactId } = req.params;
      const { favorite } = req.body;
      const result = await ContactController.updateStatusContact(
        contactId,
        favorite
      );
      if (!result) {
        return res.status(STATUS_CODES.notFound).json({
          message: "Contactul nu a fost găsit",
        });
      }
      res.status(STATUS_CODES.success).json({
        message: "Statusul a fost actualizat cu succes",
        data: result,
      });
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

function respondWithError(res, error) {
  console.error(error);
  res.status(STATUS_CODES.error).json({ message: error.message });
}

export default router;
