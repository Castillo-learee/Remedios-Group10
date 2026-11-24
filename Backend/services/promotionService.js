import * as promotionModel from '../models/promotionModel.js';
import ValidationError      from '../utils/ValidationError.js';

// ── compute status from DB fields ─────────────────────────────────────────────
const statusOf = (p) => {
    if (p.promotion_status === 'inactive') return 'Disabled';
    if (p.promotion_status === 'expired')  return 'Expired';
    const today = new Date().toISOString().slice(0, 10);
    if (p.start_date && today < p.start_date) return 'Scheduled';
    if (p.end_date   && today > p.end_date)   return 'Expired';
    if (p.usage_limit !== null && p.usage_count >= p.usage_limit) return 'Limit Reached';
    return 'Active';
}

const addStatus = (rows) => rows.map((r) => ({ ...r, status: statusOf(r) }));

export const fetchAll = async (filters = {}) => {
    let rows = addStatus(await promotionModel.fetch());

    if (filters.name) {
        const q = filters.name.toLowerCase();
        rows = rows.filter((r) => r.promotion_name.toLowerCase().includes(q));
    }
    if (filters.status)       rows = rows.filter((r) => r.status        === filters.status);
    if (filters.discountType) rows = rows.filter((r) => r.discount_type === filters.discountType);

    return rows;
}

export const fetchById = async (id) => {
    const rows = await promotionModel.findById(id);
    if (rows.length === 0) throw new ValidationError('Promotion does not exist!', 404);
    return { ...rows[0], status: statusOf(rows[0]) };
}

// ── validate and clean promotion input ───────────────────────────────────────
const validate = async (data, currentId = null) => {
    const name = String(data.name ?? data.promotion_name ?? '').trim();
    if (!name) throw new ValidationError('Promotion name is required!', 400);

    const discountType = String(data.discountType ?? '').trim();
    if (!['percentage', 'fixed'].includes(discountType)) {
        throw new ValidationError('Discount type must be percentage or fixed!', 400);
    }

    const discountValue = Number(data.discountValue);
    if (isNaN(discountValue) || discountValue <= 0) {
        throw new ValidationError('Discount value must be greater than zero!', 400);
    }
    if (discountType === 'percentage' && discountValue > 100) {
        throw new ValidationError('Percentage discount cannot exceed 100!', 400);
    }

    const voucherCode = data.voucherCode ? String(data.voucherCode).trim() : null;
    if (voucherCode) {
        const dup = await promotionModel.findByVoucherCode(voucherCode);
        if (dup.length > 0 && dup[0].promotion_id !== currentId) {
            throw new ValidationError('Voucher code already exists!', 400);
        }
    }

    if (data.startDate && data.endDate && data.endDate < data.startDate) {
        throw new ValidationError('End date cannot be before start date!', 400);
    }

    const usageLimit = data.usageLimit ? Number(data.usageLimit) : null;
    if (usageLimit !== null && (!Number.isInteger(usageLimit) || usageLimit < 1)) {
        throw new ValidationError('Usage limit must be a whole number, 1 or more!', 400);
    }

    return {
        name,
        description:  data.description  || null,
        discountType, discountValue,
        voucherCode,
        startDate:    data.startDate    || null,
        endDate:      data.endDate      || null,
        usageLimit,
        ownerId:      data.ownerId      || 1,
    };
}

export const create = async (data) => {
    const p = await validate(data);
    return await promotionModel.insert(p);
}

export const update = async (id, data) => {
    const existing = await promotionModel.findById(id);
    if (existing.length === 0) throw new ValidationError('Promotion does not exist!', 404);
    const p = await validate(data, id);
    await promotionModel.update({ ...p, id });
}

export const toggleEnabled = async (id, enabled) => {
    const existing = await promotionModel.findById(id);
    if (existing.length === 0) throw new ValidationError('Promotion does not exist!', 404);
    await promotionModel.setStatus(id, enabled ? 'active' : 'inactive');
}

export const remove = async (id) => {
    const existing = await promotionModel.findById(id);
    if (existing.length === 0) throw new ValidationError('Promotion does not exist!', 404);
    if (existing[0].usage_count > 0) {
        throw new ValidationError('Cannot delete a promotion that has already been used!', 400);
    }
    await promotionModel.remove(id);
}
