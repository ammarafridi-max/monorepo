const key = process.env.STRIPE_SECRET_KEY;
if (!key) { console.error('STRIPE_SECRET_KEY not set'); process.exit(1); }
const h = { Authorization: `Bearer ${key}` };

const acct = await (await fetch('https://api.stripe.com/v1/account', { headers: h })).json();
if (acct.error) { console.error('Stripe error:', acct.error.message); process.exit(1); }
console.log(`account country: ${acct.country}   settlement currency: ${(acct.default_currency || '').toUpperCase()}`);

const spec = await (await fetch(`https://api.stripe.com/v1/country_specs/${acct.country}`, { headers: h })).json();
const supported = new Set((spec.supported_payment_currencies || []).map((c) => c.toUpperCase()));
console.log(`chargeable currencies for this account: ${supported.size}\n`);

const want = ['SGD','AUD','PKR','IDR','PHP','NGN','TRY','ZAR','QAR','THB','MYR','JPY','KES','EGP','BDT','VND'];
console.log('  proposed books:');
for (const c of want) console.log(`    ${c}  ${supported.has(c) ? 'supported' : '** NOT SUPPORTED **'}`);

const have = ['USD','AED','SAR','INR','CAD','GBP','EUR'];
const bad = have.filter((c) => !supported.has(c));
console.log(`\n  existing books: ${have.length - bad.length}/${have.length} supported${bad.length ? ', NOT: ' + bad.join(', ') : ''}`);
