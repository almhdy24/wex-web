import { describe, it, expect } from 'vitest';
import { validateProductForm, mapServerErrors } from '../pages/admin/productForm/formLogic';

const valid = {
  name: 'HP ProBook 440 G7', type: 'laptop', category_id: '3', condition: 'used_imported',
  price_aed: '1200', stock_quantity: 1,
};

describe('admin product form validation (Arabic, field-level)', () => {
  it('accepts a valid payload', () => {
    expect(validateProductForm(valid)).toEqual({});
  });

  it('flags every missing/invalid field with an Arabic message', () => {
    const e = validateProductForm({ name: '', type: '', category_id: '', condition: 'used', price_aed: '', stock_quantity: 1 });
    ['name', 'type', 'category_id', 'condition', 'price_aed'].forEach((k) => {
      expect(e[k], k).toMatch(/[؀-ۿ]/);
    });
  });

  it('rejects the old broken condition values the API never accepted', () => {
    ['brand_new', 'open_box', 'used'].forEach((c) => {
      expect(validateProductForm({ ...valid, condition: c }).condition).toBeTruthy();
    });
    ['new', 'used_imported', 'refurbished'].forEach((c) => {
      expect(validateProductForm({ ...valid, condition: c }).condition).toBeUndefined();
    });
  });

  it('rejects decimal and non-positive prices', () => {
    expect(validateProductForm({ ...valid, price_aed: '1200.5' }).price_aed).toMatch(/صحيح/);
    expect(validateProductForm({ ...valid, price_aed: '0' }).price_aed).toBeTruthy();
    expect(validateProductForm({ ...valid, price_aed: '-5' }).price_aed).toBeTruthy();
  });

  it('maps server errors to Arabic and never shows raw English', () => {
    const m = mapServerErrors({ category_id: 'The category_id field is required.', name: 'اسم الجهاز مطلوب', weird: 'Nope' });
    expect(m.category_id).toBe('اختر القسم');
    expect(m.name).toBe('اسم الجهاز مطلوب');
    expect(m.weird).toBe('قيمة غير صحيحة');
    Object.values(m).forEach((v) => expect(v).toMatch(/[؀-ۿ]/));
  });
});
