import test from 'node:test';
import assert from 'node:assert/strict';
import { dialCodeToCountry, genderFromTitle, toE164, DIAL_CODE_COUNTRY } from '../src/contact.js';

test('dialCodeToCountry maps the codes the data actually contains', () => {
  assert.equal(dialCodeToCountry('+971'), 'AE');
  assert.equal(dialCodeToCountry('971'), 'AE');
  assert.equal(dialCodeToCountry('+91'), 'IN');
  assert.equal(dialCodeToCountry('+44'), 'GB');
  assert.equal(dialCodeToCountry('+234'), 'NG');
  assert.equal(dialCodeToCountry('+880'), 'BD');
  assert.equal(dialCodeToCountry('880'), 'BD');
});

test('dialCodeToCountry tolerates the 00 prefix and stray punctuation', () => {
  assert.equal(dialCodeToCountry('0033'), 'FR');
  assert.equal(dialCodeToCountry(' +49 '), 'DE');
  assert.equal(dialCodeToCountry('+1-242'), 'BS');
});

test('dialCodeToCountry resolves the shared +1 range by currency', () => {
  assert.equal(dialCodeToCountry('+1'), 'US');
  assert.equal(dialCodeToCountry('+1', { currency: 'USD' }), 'US');
  assert.equal(dialCodeToCountry('+1', { currency: 'CAD' }), 'CA');
  assert.equal(dialCodeToCountry('+1', { currency: 'cad' }), 'CA');
  assert.equal(dialCodeToCountry('+1', { currency: 'EUR' }), 'US');
});

test('dialCodeToCountry returns undefined rather than guessing', () => {
  assert.equal(dialCodeToCountry(''), undefined);
  assert.equal(dialCodeToCountry(null), undefined);
  assert.equal(dialCodeToCountry('+999'), undefined);
  assert.equal(dialCodeToCountry('abc'), undefined);
});

test('genderFromTitle covers the titles in use and nothing else', () => {
  assert.equal(genderFromTitle('Mr.'), 'm');
  assert.equal(genderFromTitle('mr'), 'm');
  assert.equal(genderFromTitle('Mrs.'), 'f');
  assert.equal(genderFromTitle('Ms.'), 'f');
  assert.equal(genderFromTitle('Miss'), 'f');
  assert.equal(genderFromTitle('Dr.'), undefined);
  assert.equal(genderFromTitle(''), undefined);
  assert.equal(genderFromTitle(undefined), undefined);
});

test('toE164 joins the code and the national number', () => {
  assert.equal(toE164('+971', '501234567'), '971501234567');
  assert.equal(toE164('971', '501234567'), '971501234567');
  assert.equal(toE164('+44', '7700900123'), '447700900123');
});

test('toE164 drops a national trunk zero', () => {
  assert.equal(toE164('+971', '0501234567'), '971501234567');
  assert.equal(toE164('+44', '07700900123'), '447700900123');
});

test('toE164 does not double the country code when the number already carries it', () => {
  assert.equal(toE164('+971', '971501234567'), '971501234567');
  assert.equal(toE164('+91', '919876543210'), '919876543210');
});

test('toE164 strips formatting characters', () => {
  assert.equal(toE164('+1', '(555) 491-1850'), '15554911850');
  assert.equal(toE164('+49', '030 / 1234 5678'), '493012345678');
});

test('toE164 rejects lengths outside the E.164 range', () => {
  assert.equal(toE164('+1', '12'), undefined);
  assert.equal(toE164('+971', '9999999999999999999'), undefined);
  assert.equal(toE164('', '501234567'), undefined);
  assert.equal(toE164('+971', ''), undefined);
  assert.equal(toE164('+971', '0'), undefined);
});

test('every mapped country is a two letter uppercase code', () => {
  for (const [code, iso] of Object.entries(DIAL_CODE_COUNTRY)) {
    assert.match(String(code), /^\d+$/, `dial code ${code} should be digits`);
    assert.match(iso, /^[A-Z]{2}$/, `${code} maps to ${iso}`);
  }
});
