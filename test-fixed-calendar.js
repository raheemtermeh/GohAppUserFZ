// Test the fixed calendar conversion
const { toSolarHijri } = require('solarhijri-js');

// Simulate the gregorianToSolarHijri function
function gregorianToSolarHijri(gregorianDate) {
  const date = typeof gregorianDate === 'string' ? new Date(gregorianDate) : gregorianDate;
  
  const jalaaliDate = toSolarHijri(date.getFullYear(), date.getMonth() + 1, date.getDate());
  
  const PERSIAN_MONTHS = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  
  const PERSIAN_DAYS = [
    'شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنج‌شنبه', 'جمعه'
  ];
  
  const dayOfWeek = date.getDay();
  const persianDayName = PERSIAN_DAYS[dayOfWeek];
  
  return {
    year: jalaaliDate.hy,
    month: jalaaliDate.hm,
    day: jalaaliDate.hd,
    monthName: PERSIAN_MONTHS[jalaaliDate.hm - 1],
    dayName: persianDayName
  };
}

// Test the getCurrentSolarHijriDate function
function getCurrentSolarHijriDate() {
  const now = new Date();
  const solarDate = gregorianToSolarHijri(now);
  
  return {
    year: solarDate.year,
    month: solarDate.month,
    day: solarDate.day,
    monthName: solarDate.monthName,
    dayName: solarDate.dayName
  };
}

console.log('=== Testing Fixed Calendar Conversion ===');
console.log('Current date (dynamic):');
const current = getCurrentSolarHijriDate();
console.log(`  ${current.day} ${current.monthName} ${current.year} (${current.dayName})`);

console.log('\nTesting specific dates:');
console.log('October 16, 2025:');
const oct16 = gregorianToSolarHijri(new Date('2025-10-16'));
console.log(`  ${oct16.day} ${oct16.monthName} ${oct16.year} (${oct16.dayName})`);

console.log('October 1, 2025:');
const oct1 = gregorianToSolarHijri(new Date('2025-10-01'));
console.log(`  ${oct1.day} ${oct1.monthName} ${oct1.year} (${oct1.dayName})`);

console.log('September 23, 2025 (should be مهر):');
const sep23 = gregorianToSolarHijri(new Date('2025-09-23'));
console.log(`  ${sep23.day} ${sep23.monthName} ${sep23.year} (${sep23.dayName})`);

console.log('October 23, 2025 (should be آبان):');
const oct23 = gregorianToSolarHijri(new Date('2025-10-23'));
console.log(`  ${oct23.day} ${oct23.monthName} ${oct23.year} (${oct23.dayName})`);

console.log('\n=== Month boundaries ===');
console.log('September 22, 2025 (last day of شهریور):');
const sep22 = gregorianToSolarHijri(new Date('2025-09-22'));
console.log(`  ${sep22.day} ${sep22.monthName} ${sep22.year}`);

console.log('September 23, 2025 (first day of مهر):');
const sep23_2 = gregorianToSolarHijri(new Date('2025-09-23'));
console.log(`  ${sep23_2.day} ${sep23_2.monthName} ${sep23_2.year}`);

console.log('October 22, 2025 (last day of مهر):');
const oct22 = gregorianToSolarHijri(new Date('2025-10-22'));
console.log(`  ${oct22.day} ${oct22.monthName} ${oct22.year}`);

console.log('October 23, 2025 (first day of آبان):');
const oct23_2 = gregorianToSolarHijri(new Date('2025-10-23'));
console.log(`  ${oct23_2.day} ${oct23_2.monthName} ${oct23_2.year}`);
