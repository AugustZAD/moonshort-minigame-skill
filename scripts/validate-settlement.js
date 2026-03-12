#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const MODIFIER_BY_RATING = {
  S: 2,
  A: 1,
  B: 0,
  C: -1,
  D: -2,
};

function fail(message) {
  console.error(`Invalid settlement: ${message}`);
  process.exit(1);
}

function readPayload() {
  const file = process.argv[2];
  if (!file) {
    fail('missing JSON file path, usage: node scripts/validate-settlement.js <payload.json>');
  }

  const absolutePath = path.resolve(process.cwd(), file);
  let raw;
  try {
    raw = fs.readFileSync(absolutePath, 'utf8');
  } catch (error) {
    fail(`cannot read file ${absolutePath}`);
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    fail('file is not valid JSON');
  }
}

function validate(payload) {
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) {
    fail('payload must be a JSON object');
  }

  if (!Object.prototype.hasOwnProperty.call(payload, 'rating')) {
    fail('missing `rating`');
  }
  if (!Object.prototype.hasOwnProperty.call(payload, 'score')) {
    fail('missing `score`');
  }
  if (!Object.prototype.hasOwnProperty.call(payload, 'attribute')) {
    fail('missing `attribute`');
  }
  if (!Object.prototype.hasOwnProperty.call(payload, 'modifier')) {
    fail('missing `modifier`');
  }

  if (!Object.prototype.hasOwnProperty.call(MODIFIER_BY_RATING, payload.rating)) {
    fail('`rating` must be one of S/A/B/C/D');
  }
  if (typeof payload.score !== 'number' || !Number.isFinite(payload.score)) {
    fail('`score` must be a finite number');
  }
  if (typeof payload.attribute !== 'string' || payload.attribute.length === 0) {
    fail('`attribute` must be a non-empty string');
  }
  if (payload.modifier !== MODIFIER_BY_RATING[payload.rating]) {
    fail('`modifier` does not match the rating mapping');
  }
}

const payload = readPayload();
validate(payload);
console.log('Settlement payload is valid.');
