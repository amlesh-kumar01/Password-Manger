import { Schema, model } from 'mongoose';

const FormFieldSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  value: {
    type: String,
    required: true
  },
  type: {
    type: String,
    default: 'text'
  },
  sensitive: {
    type: Boolean,
    default: false
  }
});

const FormDataSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  website: {
    type: String,
    required: true
  },
  url: {
    type: String
  },
  fields: [FormFieldSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Pre-save hook to update updatedAt
FormDataSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

export default model('FormData', FormDataSchema);
