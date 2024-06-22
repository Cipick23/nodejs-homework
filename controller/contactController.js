import Contact from "../models/contacts.js";

const ContactController = {
  listContacts,
  getContactById,
  addContact,
  updateContact,
  updateStatusContact,
  removeContact,
};

async function listContacts() {
  try {
    return Contact.find();
  } catch (error) {
    console.error(error);
  }
}

async function getContactById(id) {
  try {
    return Contact.findById(id);
  } catch (error) {
    console.error(error);
  }
}

async function addContact(contact) {
  return Contact.create(contact);
}

async function updateContact(updatedContact, id) {
  return Contact.findByIdAndUpdate(id, updatedContact, { new: true });
}

async function updateStatusContact(id, favorite) {
  return Contact.findByIdAndUpdate(id, { favorite }, { new: true });
}

async function removeContact(id) {
  return Contact.findByIdAndDelete(id);
}

export default ContactController;
