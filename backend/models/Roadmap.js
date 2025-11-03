const mongoose = require('mongoose');

const TrackSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  hours: {
    type: Number,
  },
  required: {
    type: Boolean,
    default: true,
  },
  link: {
    type: String,
  },
  notes: {
    type: String,
  },
});

const RoadmapSchema = new mongoose.Schema(
  {
    role_slug: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    role_title: {
      type: String,
      required: true,
    },
    language: {
      type: String,
      default: 'fa',
      index: true,
    },
    summary: {
      type: String,
    },
    tracks: [TrackSchema],
  },
  {
    // Explicitly set the collection name as requested
    collection: 'roadmap',
    timestamps: true,
  }
);

module.exports = mongoose.model('Roadmap', RoadmapSchema);