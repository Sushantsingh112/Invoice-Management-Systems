import { useState, useEffect } from 'react';
import { Plus, Trash2, ChevronDown } from 'lucide-react';
import { calcLineItem, formatCurrency } from '@/utils/helpers';
import { settingsAPI } from '@/services/api';

const emptyItem = {
  item_name: '', description: '', quantity: 1,
  unit_price: 0, discount_percentage: 0, tax_percentage: 0,
};

export default function LineItemsEditor({ value = [], onChange, currency = 'INR', paymentSettings }) {
  const [items, setItems] = useState(value.length ? value : [{ ...emptyItem }]);
  const [predefined, setPredefined] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);

  useEffect(() => {
    settingsAPI.getPredefinedItems().then(r => setPredefined(r.data.data)).catch(() => {});
    settingsAPI.getTax().then(r => setTaxes(r.data.data)).catch(() => {});
  }, []);

  const fmt = (v) => formatCurrency(v, paymentSettings);

  const updateItem = (index, field, val) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = { ...item, [field]: val };
      const calc = calcLineItem(newItem.quantity, newItem.unit_price, newItem.discount_percentage, newItem.tax_percentage);
      return { ...newItem, ...calc };
    });
    setItems(updated);
    onChange(updated);
  };

  const addItem = () => {
    const updated = [...items, { ...emptyItem }];
    setItems(updated);
    onChange(updated);
  };

  const removeItem = (index) => {
    if (items.length === 1) return;
    const updated = items.filter((_, i) => i !== index);
    setItems(updated);
    onChange(updated);
  };

  const applyPredefined = (index, predItem) => {
    const updated = items.map((item, i) => {
      if (i !== index) return item;
      const newItem = {
        ...item,
        item_name: predItem.item_name,
        description: predItem.description || '',
        unit_price: predItem.unit_price,
        tax_percentage: predItem.tax_percentage,
      };
      const calc = calcLineItem(newItem.quantity, newItem.unit_price, newItem.discount_percentage, newItem.tax_percentage);
      return { ...newItem, ...calc };
    });
    setItems(updated);
    onChange(updated);
    setActiveDropdown(null);
  };

  // Totals
  const subtotal = items.reduce((s, i) => s + (calcLineItem(i.quantity, i.unit_price, i.discount_percentage, i.tax_percentage).subtotal), 0);
  const discount = items.reduce((s, i) => s + (calcLineItem(i.quantity, i.unit_price, i.discount_percentage, i.tax_percentage).discountAmount), 0);
  const tax = items.reduce((s, i) => s + (calcLineItem(i.quantity, i.unit_price, i.discount_percentage, i.tax_percentage).taxAmount), 0);
  const total = subtotal - discount + tax;

  return (
    <div>
      <div className="overflow-x-auto rounded-lg border border-gray-200">
        <table className="w-full line-items-table text-sm">
          <thead>
            <tr>
              <th className="w-8 text-center">#</th>
              <th className="min-w-48">Item / Description</th>
              <th className="w-20 text-center">Qty</th>
              <th className="w-28 text-right">Rate</th>
              <th className="w-20 text-center">Disc%</th>
              <th className="w-20 text-center">Tax%</th>
              <th className="w-28 text-right">Amount</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const calc = calcLineItem(item.quantity, item.unit_price, item.discount_percentage, item.tax_percentage);
              return (
                <tr key={idx} className="hover:bg-blue-50/20">
                  <td className="text-center text-gray-400 text-xs">{idx + 1}</td>
                  <td>
                    <div className="relative">
                      <div className="flex items-center gap-1 mb-1">
                        <input
                          value={item.item_name}
                          onChange={e => updateItem(idx, 'item_name', e.target.value)}
                          placeholder="Item name"
                          className="form-input text-sm font-medium flex-1"
                        />
                        {predefined.length > 0 && (
                          <div className="relative">
                            <button type="button"
                              onClick={() => setActiveDropdown(activeDropdown === idx ? null : idx)}
                              className="btn-ghost btn-icon text-gray-400 h-8 w-8">
                              <ChevronDown size={13} />
                            </button>
                            {activeDropdown === idx && (
                              <div className="absolute right-0 top-9 z-20 bg-white rounded-xl shadow-xl border border-gray-100 w-72 py-1 max-h-52 overflow-y-auto">
                                {predefined.map(p => (
                                  <button key={p.id} type="button"
                                    onClick={() => applyPredefined(idx, p)}
                                    className="w-full text-left px-4 py-2.5 hover:bg-blue-50 text-sm">
                                    <div className="font-medium text-gray-800">{p.item_name}</div>
                                    <div className="text-xs text-gray-400">{fmt(p.unit_price)} · GST {p.tax_percentage}%</div>
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                      <input
                        value={item.description || ''}
                        onChange={e => updateItem(idx, 'description', e.target.value)}
                        placeholder="Description (optional)"
                        className="form-input text-xs text-gray-500 w-full"
                      />
                    </div>
                  </td>
                  <td>
                    <input type="number" min="0" step="0.01"
                      value={item.quantity}
                      onChange={e => updateItem(idx, 'quantity', parseFloat(e.target.value) || 0)}
                      className="form-input text-center text-sm w-full"
                    />
                  </td>
                  <td>
                    <input type="number" min="0" step="0.01"
                      value={item.unit_price}
                      onChange={e => updateItem(idx, 'unit_price', parseFloat(e.target.value) || 0)}
                      className="form-input text-right text-sm w-full"
                    />
                  </td>
                  <td>
                    <input type="number" min="0" max="100" step="0.1"
                      value={item.discount_percentage}
                      onChange={e => updateItem(idx, 'discount_percentage', parseFloat(e.target.value) || 0)}
                      className="form-input text-center text-sm w-full"
                    />
                  </td>
                  <td>
                    <select
                      value={item.tax_percentage}
                      onChange={e => updateItem(idx, 'tax_percentage', parseFloat(e.target.value) || 0)}
                      className="form-select text-sm w-full"
                    >
                      <option value="0">0%</option>
                      {taxes.map(t => (
                        <option key={t.id} value={t.tax_percentage}>{t.tax_name} ({t.tax_percentage}%)</option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right">
                    <div className="font-semibold text-gray-900">{fmt(calc.total)}</div>
                    {calc.discountAmount > 0 && (
                      <div className="text-xs text-gray-400">- {fmt(calc.discountAmount)} disc</div>
                    )}
                    {calc.taxAmount > 0 && (
                      <div className="text-xs text-gray-400">+ {fmt(calc.taxAmount)} tax</div>
                    )}
                  </td>
                  <td className="text-center">
                    <button type="button" onClick={() => removeItem(idx)}
                      disabled={items.length === 1}
                      className="btn-ghost btn-icon text-gray-300 hover:text-red-500 disabled:opacity-20 h-7 w-7">
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Add Item Button */}
      <button type="button" onClick={addItem}
        className="mt-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 text-sm font-medium
          px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors">
        <Plus size={15} /> Add Line Item
      </button>

      {/* Totals Summary */}
      <div className="mt-4 flex justify-end">
        <div className="w-72 space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Subtotal</span><span className="font-medium">{fmt(subtotal)}</span>
          </div>
          {discount > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Total Discount</span>
              <span className="text-red-500 font-medium">- {fmt(discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm text-gray-600">
            <span>Total Tax</span>
            <span className="text-emerald-600 font-medium">+ {fmt(tax)}</span>
          </div>
          <div className="flex justify-between text-base font-bold text-gray-900 pt-2 border-t border-gray-200">
            <span>Grand Total</span><span className="text-blue-700">{fmt(total)}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
