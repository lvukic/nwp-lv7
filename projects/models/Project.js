const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
    naziv: { type: String, required: true },
    opis: String,
    cijena: Number,
    obavljeniPoslovi: { type: String, default: "" },
    datumPocetka: Date,
    datumZavrsetka: Date,
    arhiviran: { type: Boolean, default: false },
    voditelj: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    clanovi_tima: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Project', ProjectSchema);