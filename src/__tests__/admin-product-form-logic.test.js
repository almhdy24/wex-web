import { describe, it, expect } from 'vitest';
import {
  validateProductForm, mapServerErrors, completeness, buildProductName, properCase, typoWarning,
  duplicateWarning, formatThousands, digitsOnly, visibleFields, firstErrorField, sectionsWithErrors, cleanSpecs,
} from '../pages/admin/productForm/formLogic';

const schema = {
  fields: [
    { key: 'ram_gb', label: 'حجم الرام', input: 'segmented', required: true, options: [{ value: '8', label: '8 GB' }] },
    { key: 'cpu_family', label: 'المعالج', input: 'select', required: true, options: [{ value: 'i5', label: 'Core i5' }] },
    { key: 'cpu_gen', label: 'جيل', input: 'select', when: { field: 'cpu_family', in: ['i5'] }, options: [{ value: '8', label: 'الجيل 8' }] },
    { key: 'gpu_model', label: 'موديل الكرت', input: 'text', when: { field: 'gpu_kind', in: ['dedicated'] } },
    { key: 'battery_mah', label: 'بطارية', input: 'number', min: 1000, max: 10000 },
  ],
};
const base = { name: 'HP ProBook 440 G7', type: 'laptop', category_id: '1', condition: 'new', price_aed: '1200', stock_quantity: 1, specs: {} };

describe('schema-driven validation', () => {
  it('requires schema-required specs with `spec.` keys and Arabic text', () => {
    const e = validateProductForm(base, schema);
    expect(e['spec.ram_gb']).toMatch(/[؀-ۿ]/);
    expect(e['spec.cpu_family']).toBeTruthy();
  });
  it('passes when specs are filled and checks number ranges', () => {
    const f = { ...base, specs: { ram_gb: '8', cpu_family: 'i5' } };
    expect(validateProductForm(f, schema)).toEqual({});
    expect(validateProductForm({ ...f, specs: { ...f.specs, battery_mah: '50' } }, schema)['spec.battery_mah']).toBeTruthy();
  });
  it('draft mode only needs a name and a type', () => {
    expect(validateProductForm({ name: 'مسودة', type: 'phone' }, schema, { draft: true })).toEqual({});
  });
  it('hides conditional fields and drops their values', () => {
    expect(visibleFields(schema, { cpu_family: 'i5' }).map((f) => f.key)).not.toContain('gpu_model');
    expect(cleanSpecs({ ram_gb: '8', gpu_model: 'GTX', foo: 1 }, schema)).toEqual({ ram_gb: '8' });
  });
  it('maps spec_data.* server errors to spec.* and keeps Arabic', () => {
    const m = mapServerErrors({ 'spec_data.ram_gb': 'The ram_gb is bad', 'spec_data.cpu_family': 'هذا الحقل مطلوب' });
    expect(m['spec.ram_gb']).toMatch(/[؀-ۿ]/);
    expect(m['spec.cpu_family']).toBe('هذا الحقل مطلوب');
  });
  it('finds the first invalid field in section order', () => {
    const errs = { price_aed: 'x', 'spec.ram_gb': 'y', name: 'z' };
    expect(firstErrorField(errs)).toBe('name');
    expect([...sectionsWithErrors(errs)].sort()).toEqual(['basic', 'pricing', 'specs']);
  });
});

describe('names and typo guard', () => {
  it('builds a properly-cased name from brand + model', () => {
    expect(buildProductName('HP', 'probook 440 g7')).toBe('HP ProBook 440 G7');
    expect(buildProductName('Dell', 'Dell Latitude 5420')).toBe('Dell Latitude 5420');
    expect(properCase('lenovo thinkpad t480')).toBe('Lenovo ThinkPad T480');
  });
  it('flags BROPOOK as a near miss of ProBook, but not correct names', () => {
    expect(typoWarning('HP BROPOOK 440 G7')).toMatch(/ProBook/);
    expect(typoWarning('HP ProBook 440 G7')).toBeNull();
  });
  it('warns on near-identical existing names', () => {
    expect(duplicateWarning('HP ProBook 440 G7', ['HP Probook 440 G7', 'Dell XPS'])).toMatch(/HP Probook 440 G7/);
    expect(duplicateWarning('Lenovo T14', ['HP ProBook 440 G7'])).toBeNull();
  });
});

describe('price input + completeness', () => {
  it('formats thousands and converts Arabic digits', () => {
    expect(formatThousands('1200000')).toBe('1,200,000');
    expect(digitsOnly('١٢٠٠')).toBe('1200');
  });
  it('computes a percent and lists what is missing', () => {
    const empty = completeness({ ...base, name: '', price_aed: '', specs: {} }, schema, 0);
    expect(empty.percent).toBeLessThan(30);
    expect(empty.missing.length).toBeGreaterThan(3);
    const full = completeness({ ...base, brand_id: '3', short_description: 'x', specs: { ram_gb: '8', cpu_family: 'i5' } }, schema, 3);
    expect(full.percent).toBe(100);
    expect(full.missing).toEqual([]);
  });
});
