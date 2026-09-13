import { describe, it, expect } from 'vitest';
import { hotelInfo, roleLabels, guestById, serviceTypeById, TODAY } from './hotel.js';

describe('hotel.js seed data', () => {
  it('has hotelInfo with required fields', () => {
    expect(hotelInfo.name).toBe('LuxuryStay');
    expect(hotelInfo.phone).toBeDefined();
    expect(hotelInfo.email).toBeDefined();
  });

  it('roleLabels has all 6 roles', () => {
    expect(Object.keys(roleLabels)).toHaveLength(6);
    expect(roleLabels.admin).toBe('Administrator');
    expect(roleLabels.guest).toBe('Guest');
  });

  it('guestById provides lookup by id', () => {
    expect(guestById['g-1042']).toBeDefined();
    expect(guestById['g-1042'].name).toBe('Eleanor Whitfield');
  });

  it('TODAY is a valid date string', () => {
    expect(TODAY).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('serviceTypeById maps service IDs to labels', () => {
    expect(serviceTypeById).toBeDefined();
    expect(serviceTypeById['room-service']).toBeDefined();
    expect(serviceTypeById['wake-up-call']).toBeDefined();
  });
});
