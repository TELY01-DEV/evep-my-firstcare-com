import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type Language = 'en' | 'th';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

interface LanguageProviderProps {
  children: ReactNode;
}

// Translation data
const translations = {
  en: {
    // Common
    'common.loading': 'Loading...',
    'common.error': 'Error',
    'common.success': 'Success',
    'common.cancel': 'Cancel',
    'common.save': 'Save',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.close': 'Close',
    'common.confirm': 'Confirm',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.search': 'Search',
    'common.filter': 'Filter',
    'common.hide_filters': 'Hide Filters',
    'common.reset': 'Reset',
    'common.print': 'Print',
    'common.refresh': 'Refresh',
    'common.add': 'Add',
    'common.remove': 'Remove',
    'common.back': 'Back',
    'common.next': 'Next',
    'common.previous': 'Previous',
    'common.submit': 'Submit',
    'common.clear': 'Clear',
    'common.all': 'All',
    'common.none': 'None',
    'common.select': 'Select',
    'common.required': 'Required',
    'common.optional': 'Optional',
    'common.status': 'Status',
    'common.date': 'Date',
    'common.time': 'Time',
    'common.name': 'Name',
    'common.email': 'Email',
    'common.phone': 'Phone',
    'common.address': 'Address',
    'common.actions': 'Actions',
    'common.created_at': 'Created At',
    'common.updated_at': 'Updated At',
    'common.total': 'Total',
    'common.completed': 'Completed',
    'common.pending': 'Pending',
    'common.in_progress': 'In Progress',
    'common.active': 'Active',
    'common.inactive': 'Inactive',
    'common.enabled': 'Enabled',
    'common.disabled': 'Disabled',
    'common.public': 'Public',
    'common.private': 'Private',
    'common.draft': 'Draft',
    'common.published': 'Published',
    'common.archived': 'Archived',
    
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.school_management': 'School Management',
    'nav.school_screenings': 'School Screenings',
    'nav.students': 'Students',
    'nav.teachers': 'Teachers',
    'nav.schools': 'Schools',
    'nav.parents': 'Parents',
    'nav.medical_staff': 'Medical Staff',
    'nav.hospitals': 'Hospitals',
    'nav.screenings': 'Screenings',
    'nav.reports': 'Reports',
    'nav.settings': 'Settings',
    'nav.user_management': 'User Management',
    'nav.admin_panel': 'Admin Panel',
    'nav.logout': 'Logout',
    'nav.profile': 'Profile',
    'nav.notifications': 'Notifications',
    'nav.language': 'Language',
    
    // School Screenings
    'school_screenings.title': 'School Screenings',
    'school_screenings.subtitle': 'Manage school-based vision screening sessions',
    'school_screenings.create_new': 'Create New School Screening',
    'school_screenings.total_screenings': 'Total Screenings',
    'school_screenings.completed': 'Completed',
    'school_screenings.in_progress': 'In Progress',
    'school_screenings.pending': 'Pending',
    'school_screenings.available_students': 'Available Students',
    'school_screenings.recent_screenings': 'Recent School Screenings',
    'school_screenings.show_filters': 'Show Filters',
    'school_screenings.student': 'Student',
    'school_screenings.examiner': 'Examiner',
    'school_screenings.type': 'Type',
    'school_screenings.status': 'Status',
    'school_screenings.date': 'Date',
    'school_screenings.actions': 'Actions',
    'school_screenings.screenings': 'screenings',
    'school_screenings.rescreen': 'Re-screen',
    'school_screenings.history': 'History',
    'school_screenings.view_details': 'View Details',
    'school_screenings.edit_screening': 'Edit Screening',
    'school_screenings.delete_screening': 'Delete Screening',
    'school_screenings.print_screening': 'Print Screening',
    'school_screenings.view_history': 'View Student History',
    'school_screenings.basic_school': 'Basic School Screening',
    'school_screenings.vision_test': 'Vision Test',
    'school_screenings.color_blindness': 'Color Blindness Test',
    'school_screenings.depth_perception': 'Depth Perception Test',
    
    // Screening Form
    'screening_form.title': 'Create New School Screening',
    'screening_form.student_selection': 'Student Selection',
    'screening_form.screening_setup': 'Screening Setup',
    'screening_form.screening_results': 'Screening Results',
    'screening_form.conclusion': 'Conclusion',
    'screening_form.select_student': 'Select Student',
    'screening_form.select_examiner': 'Select Examiner',
    'screening_form.screening_type': 'Screening Type',
    'screening_form.screening_date': 'Screening Date',
    'screening_form.notes': 'Notes',
    'screening_form.left_eye': 'Left Eye',
    'screening_form.right_eye': 'Right Eye',
    'screening_form.distance_acuity': 'Distance Acuity',
    'screening_form.near_acuity': 'Near Acuity',
    'screening_form.color_vision': 'Color Vision',
    'screening_form.depth_perception': 'Depth Perception',
    'screening_form.conclusion_text': 'Conclusion',
    'screening_form.recommendations': 'Recommendations',
    'screening_form.referral_needed': 'Referral Needed',
    'screening_form.referral_notes': 'Referral Notes',
    
    // Student Information
    'student.name': 'Student Name',
    'student.grade_level': 'Grade Level',
    'student.school': 'School',
    'student.birth_date': 'Birth Date',
    'student.age': 'Age',
    'student.gender': 'Gender',
    'student.parent_name': 'Parent Name',
    'student.parent_phone': 'Parent Phone',
    'student.address': 'Address',
    'student.male': 'Male',
    'student.female': 'Female',
    'student.years': 'years',
    
    // Teacher Information
    'teacher.name': 'Teacher Name',
    'teacher.school': 'School',
    'teacher.email': 'Email',
    'teacher.phone': 'Phone',
    
    // Messages
    'message.screening_created': 'Screening created successfully',
    'message.screening_updated': 'Screening updated successfully',
    'message.screening_deleted': 'Screening deleted successfully',
    'message.rescreen_created': 'Re-screen created successfully',
    'message.error_creating_screening': 'Error creating screening',
    'message.error_updating_screening': 'Error updating screening',
    'message.error_deleting_screening': 'Error deleting screening',
    'message.error_fetching_data': 'Error fetching data',
    'message.confirm_delete': 'Are you sure you want to delete this screening?',
    'message.confirm_rescreen': 'Are you sure you want to create a re-screen for this student?',
    'message.duplicate_screening': 'Student already has a screening on this date. Use re-screen action instead.',
    'message.print_dialog_opened': 'Print dialog opened successfully',
    'message.popup_blocked': 'Please allow popups to print the screening record',
    
    // Print Report
    'print.title': 'Vision Screening Report',
    'print.student_info': 'Student Information',
    'print.examiner_info': 'Examiner Information',
    'print.screening_results': 'Screening Results',
    'print.conclusion_recommendations': 'Conclusion & Recommendations',
    'print.generated_by': 'This report was generated by EVEP System',
    'print.printed_on': 'Printed on',
    'print.eye_left': 'Left',
    'print.eye_right': 'Right',
    'print.referral_yes': 'Yes',
    'print.referral_no': 'No',
  },
  th: {
    // Common
    'common.loading': 'กำลังโหลด...',
    'common.error': 'ข้อผิดพลาด',
    'common.success': 'สำเร็จ',
    'common.cancel': 'ยกเลิก',
    'common.save': 'บันทึก',
    'common.delete': 'ลบ',
    'common.edit': 'แก้ไข',
    'common.view': 'ดู',
    'common.close': 'ปิด',
    'common.confirm': 'ยืนยัน',
    'common.yes': 'ใช่',
    'common.no': 'ไม่',
    'common.search': 'ค้นหา',
    'common.filter': 'กรอง',
    'common.hide_filters': 'ซ่อนตัวกรอง',
    'common.reset': 'รีเซ็ต',
    'common.print': 'พิมพ์',
    'common.refresh': 'รีเฟรช',
    'common.add': 'เพิ่ม',
    'common.remove': 'ลบออก',
    'common.back': 'กลับ',
    'common.next': 'ถัดไป',
    'common.previous': 'ก่อนหน้า',
    'common.submit': 'ส่ง',
    'common.clear': 'ล้าง',
    'common.all': 'ทั้งหมด',
    'common.none': 'ไม่มี',
    'common.select': 'เลือก',
    'common.required': 'จำเป็น',
    'common.optional': 'ไม่จำเป็น',
    'common.status': 'สถานะ',
    'common.date': 'วันที่',
    'common.time': 'เวลา',
    'common.name': 'ชื่อ',
    'common.email': 'อีเมล',
    'common.phone': 'โทรศัพท์',
    'common.address': 'ที่อยู่',
    'common.actions': 'การดำเนินการ',
    'common.created_at': 'สร้างเมื่อ',
    'common.updated_at': 'อัปเดตเมื่อ',
    'common.total': 'รวม',
    'common.completed': 'เสร็จสิ้น',
    'common.pending': 'รอดำเนินการ',
    'common.in_progress': 'กำลังดำเนินการ',
    'common.active': 'ใช้งาน',
    'common.inactive': 'ไม่ใช้งาน',
    'common.enabled': 'เปิดใช้งาน',
    'common.disabled': 'ปิดใช้งาน',
    'common.public': 'สาธารณะ',
    'common.private': 'ส่วนตัว',
    'common.draft': 'ร่าง',
    'common.published': 'เผยแพร่',
    'common.archived': 'เก็บถาวร',
    
    // Navigation
    'nav.dashboard': 'แดชบอร์ด',
    'nav.school_management': 'จัดการโรงเรียน',
    'nav.school_screenings': 'การตรวจสายตาโรงเรียน',
    'nav.students': 'นักเรียน',
    'nav.teachers': 'ครู',
    'nav.schools': 'โรงเรียน',
    'nav.parents': 'ผู้ปกครอง',
    'nav.medical_staff': 'บุคลากรทางการแพทย์',
    'nav.hospitals': 'โรงพยาบาล',
    'nav.screenings': 'การตรวจ',
    'nav.reports': 'รายงาน',
    'nav.settings': 'การตั้งค่า',
    'nav.user_management': 'จัดการผู้ใช้',
    'nav.admin_panel': 'แผงควบคุมผู้ดูแล',
    'nav.logout': 'ออกจากระบบ',
    'nav.profile': 'โปรไฟล์',
    'nav.notifications': 'การแจ้งเตือน',
    'nav.language': 'ภาษา',
    
    // School Screenings
    'school_screenings.title': 'การตรวจสายตาโรงเรียน',
    'school_screenings.subtitle': 'จัดการการตรวจสายตาของโรงเรียน',
    'school_screenings.create_new': 'สร้างการตรวจใหม่',
    'school_screenings.total_screenings': 'การตรวจทั้งหมด',
    'school_screenings.completed': 'เสร็จสิ้น',
    'school_screenings.in_progress': 'กำลังดำเนินการ',
    'school_screenings.pending': 'รอดำเนินการ',
    'school_screenings.available_students': 'นักเรียนที่พร้อมตรวจ',
    'school_screenings.recent_screenings': 'การตรวจล่าสุด',
    'school_screenings.show_filters': 'แสดงตัวกรอง',
    'school_screenings.student': 'นักเรียน',
    'school_screenings.examiner': 'ผู้ตรวจ',
    'school_screenings.type': 'ประเภท',
    'school_screenings.status': 'สถานะ',
    'school_screenings.date': 'วันที่',
    'school_screenings.actions': 'การดำเนินการ',
    'school_screenings.screenings': 'การตรวจ',
    'school_screenings.rescreen': 'ตรวจซ้ำ',
    'school_screenings.history': 'ประวัติ',
    'school_screenings.view_details': 'ดูรายละเอียด',
    'school_screenings.edit_screening': 'แก้ไขการตรวจ',
    'school_screenings.delete_screening': 'ลบการตรวจ',
    'school_screenings.print_screening': 'พิมพ์การตรวจ',
    'school_screenings.view_history': 'ดูประวัตินักเรียน',
    'school_screenings.basic_school': 'การตรวจพื้นฐานโรงเรียน',
    'school_screenings.vision_test': 'ทดสอบการมองเห็น',
    'school_screenings.color_blindness': 'ทดสอบตาบอดสี',
    'school_screenings.depth_perception': 'ทดสอบการรับรู้ความลึก',
    
    // Screening Form
    'screening_form.title': 'สร้างการตรวจสายตาโรงเรียนใหม่',
    'screening_form.student_selection': 'เลือกนักเรียน',
    'screening_form.screening_setup': 'ตั้งค่าการตรวจ',
    'screening_form.screening_results': 'ผลการตรวจ',
    'screening_form.conclusion': 'สรุป',
    'screening_form.select_student': 'เลือกนักเรียน',
    'screening_form.select_examiner': 'เลือกผู้ตรวจ',
    'screening_form.screening_type': 'ประเภทการตรวจ',
    'screening_form.screening_date': 'วันที่ตรวจ',
    'screening_form.notes': 'หมายเหตุ',
    'screening_form.left_eye': 'ตาซ้าย',
    'screening_form.right_eye': 'ตาขวา',
    'screening_form.distance_acuity': 'การมองเห็นระยะไกล',
    'screening_form.near_acuity': 'การมองเห็นระยะใกล้',
    'screening_form.color_vision': 'การมองเห็นสี',
    'screening_form.depth_perception': 'การรับรู้ความลึก',
    'screening_form.conclusion_text': 'สรุปผลการตรวจ',
    'screening_form.recommendations': 'ข้อแนะนำ',
    'screening_form.referral_needed': 'ต้องส่งต่อ',
    'screening_form.referral_notes': 'หมายเหตุการส่งต่อ',
    
    // Student Information
    'student.name': 'ชื่อนักเรียน',
    'student.grade_level': 'ระดับชั้น',
    'student.school': 'โรงเรียน',
    'student.birth_date': 'วันเกิด',
    'student.age': 'อายุ',
    'student.gender': 'เพศ',
    'student.parent_name': 'ชื่อผู้ปกครอง',
    'student.parent_phone': 'โทรศัพท์ผู้ปกครอง',
    'student.address': 'ที่อยู่',
    'student.male': 'ชาย',
    'student.female': 'หญิง',
    'student.years': 'ปี',
    
    // Teacher Information
    'teacher.name': 'ชื่อครู',
    'teacher.school': 'โรงเรียน',
    'teacher.email': 'อีเมล',
    'teacher.phone': 'โทรศัพท์',
    
    // Messages
    'message.screening_created': 'สร้างการตรวจสำเร็จ',
    'message.screening_updated': 'อัปเดตการตรวจสำเร็จ',
    'message.screening_deleted': 'ลบการตรวจสำเร็จ',
    'message.rescreen_created': 'สร้างการตรวจซ้ำสำเร็จ',
    'message.error_creating_screening': 'เกิดข้อผิดพลาดในการสร้างการตรวจ',
    'message.error_updating_screening': 'เกิดข้อผิดพลาดในการอัปเดตการตรวจ',
    'message.error_deleting_screening': 'เกิดข้อผิดพลาดในการลบการตรวจ',
    'message.error_fetching_data': 'เกิดข้อผิดพลาดในการดึงข้อมูล',
    'message.confirm_delete': 'คุณแน่ใจหรือไม่ว่าต้องการลบการตรวจนี้?',
    'message.confirm_rescreen': 'คุณแน่ใจหรือไม่ว่าต้องการสร้างการตรวจซ้ำสำหรับนักเรียนคนนี้?',
    'message.duplicate_screening': 'นักเรียนมีรายการตรวจในวันที่นี้แล้ว กรุณาใช้การตรวจซ้ำแทน',
    'message.print_dialog_opened': 'เปิดหน้าต่างพิมพ์สำเร็จ',
    'message.popup_blocked': 'กรุณาอนุญาตป๊อปอัพเพื่อพิมพ์รายงานการตรวจ',
    
    // Print Report
    'print.title': 'รายงานการตรวจสายตา',
    'print.student_info': 'ข้อมูลนักเรียน',
    'print.examiner_info': 'ข้อมูลผู้ตรวจ',
    'print.screening_results': 'ผลการตรวจ',
    'print.conclusion_recommendations': 'สรุปและข้อแนะนำ',
    'print.generated_by': 'รายงานนี้สร้างโดยระบบ EVEP',
    'print.printed_on': 'พิมพ์เมื่อ',
    'print.eye_left': 'ซ้าย',
    'print.eye_right': 'ขวา',
    'print.referral_yes': 'ใช่',
    'print.referral_no': 'ไม่',
  }
};

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const t = (key: string, params?: Record<string, string | number>): string => {
    let translation = translations[language][key] || key;
    
    if (params) {
      Object.entries(params).forEach(([paramKey, paramValue]) => {
        translation = translation.replace(`{{${paramKey}}}`, String(paramValue));
      });
    }
    
    return translation;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
