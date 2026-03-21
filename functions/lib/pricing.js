"use strict";
/**
 * Server-side mirror of client mountain pricing (see src/services/mountains.ts).
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMountainForInstructor = getMountainForInstructor;
exports.getMountainLessonPriceForLessonType = getMountainLessonPriceForLessonType;
exports.resolveHourlyRateFromMountain = resolveHourlyRateFromMountain;
exports.getSessionType = getSessionType;
exports.lessonHours = lessonHours;
function getMountainForInstructor(instructor, mountains) {
    var _a;
    const byId = instructor.mountainId
        ? mountains.find((m) => m.id === instructor.mountainId)
        : undefined;
    const hm = (_a = instructor.homeMountain) === null || _a === void 0 ? void 0 : _a.trim().toLowerCase();
    const byName = hm
        ? mountains.find((m) => m.name.trim().toLowerCase() === hm)
        : undefined;
    return byId || byName || null;
}
function getMountainLessonPriceForLessonType(mountain, lessonType) {
    if (lessonType === 'private') {
        const n = mountain.privateLessonPrice;
        return n != null && n > 0 ? n : 0;
    }
    if (lessonType === 'group') {
        const n = mountain.groupLessonPrice;
        return n != null && n > 0 ? n : 0;
    }
    const g = mountain.groupLessonPrice;
    if (g != null && g > 0)
        return g;
    const p = mountain.privateLessonPrice;
    return p != null && p > 0 ? p : 0;
}
function resolveHourlyRateFromMountain(instructor, mountains, lessonType) {
    const mountain = getMountainForInstructor(instructor, mountains);
    if (!mountain)
        return null;
    const n = getMountainLessonPriceForLessonType(mountain, lessonType);
    return n > 0 ? n : null;
}
function getSessionType(startTime, endTime) {
    if (startTime === '09:00' && endTime === '12:00')
        return 'morning';
    if (startTime === '13:00' && endTime === '16:00')
        return 'afternoon';
    if (startTime === '09:00' && endTime === '17:00')
        return 'full_day';
    return 'morning';
}
function lessonHours(startTime, endTime) {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}
//# sourceMappingURL=pricing.js.map