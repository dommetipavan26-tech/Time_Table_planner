/**
 * Winter Semester 2026–27 — Course Planner data
 * -----------------------------------------------------------
 * Slot structure  : derived from "Winter semester 2026-27 Slot Timetable.pdf"
 *                   (days TUE–SAT, theory + lab periods per day).
 * Course data     : MEC3002, MEC2018, MEC2005 — from VTOP registration
 *                   screenshots (OCR).
 *                   MAT1010, MGT1040, STS2011 — from official course PDFs
 *                   (faculty, venues, slots all extracted via OCR).
 *                   MEC3011 Operations and Research — theory only, 3 credits.
 *                   MEC4003 Internal Combustion Engines — theory + lab.
 *
 * Credit model (VIT-AP FFCS):
 *   Embedded Theory and Lab course = 4 credits
 *     → theory section  = 3 credits
 *     → lab section     = 1 credit
 *   MGT1040 Embedded Theory and Project = 4 credits
 *     → theory registration carries the 1-credit project component; no lab slots
 *   MEC3011 (theory only) = 3 credits
 *   STS2011 (theory only) = 1 credit
 */

/* ------------------------------------------------------------------ */
/* Theory periods (per day) and lab periods (per day)                 */
/* ------------------------------------------------------------------ */
const SLOT_THEORY_TIMES = [
  '08:00–08:50', '09:00–09:50', '10:00–10:50', '11:00–11:50', '12:00–12:50',
  '14:00–14:50', '15:00–15:50', '16:00–16:50', '17:00–17:50', '18:00–18:50',
];
const SLOT_LAB_TIMES = [
  '08:00–08:50', '09:00–09:50', '09:50–10:40', '11:00–11:50', '11:50–12:40',
  '12:40–13:30', '14:00–14:50', '14:50–15:40', '16:00–16:50', '16:50–17:40',
  '18:00–18:50', '18:50–19:30',
];

/* ------------------------------------------------------------------ */
/* Unified timeline — rows of the rendered grid                        */
/* t = theory period index (if any), l = lab period index (if any)    */
/* ------------------------------------------------------------------ */
const TIMELINE = [
  { label: '08:00–08:50', t: 0, l: 0 },
  { label: '09:00–09:50', t: 1, l: 1 },
  { label: '09:50–10:40', l: 2 },
  { label: '10:00–10:50', t: 2 },
  { label: '11:00–11:50', t: 3, l: 3 },
  { label: '11:50–12:40', l: 4 },
  { label: '12:00–12:50', t: 4 },
  { label: '12:40–13:30', l: 5 },
  { label: 'Lunch', lunch: true },
  { label: '14:00–14:50', t: 5, l: 6 },
  { label: '14:50–15:40', l: 7 },
  { label: '15:00–15:50', t: 6 },
  { label: '16:00–16:50', t: 7, l: 8 },
  { label: '16:50–17:40', l: 9 },
  { label: '17:00–17:50', t: 8 },
  { label: '18:00–18:50', t: 9, l: 10 },
  { label: '18:50–19:30', l: 11 },
];

/* ------------------------------------------------------------------ */
/* Theory slot → period index, per day (from the PDF)                  */
/* ------------------------------------------------------------------ */
const THEORY_SLOTS = {
  TUE: { TFF1: 0, A1: 1, B1: 2, TC1: 3, G1: 3, D1: 4, F2: 5, A2: 6, B2: 7, TC2: 8, G2: 8, TDD2: 9 },
  WED: { TGG1: 0, D1: 1, F1: 2, E1: 3, SC2: 3, B1: 4, D2: 5, TF2: 6, G2: 6, E2: 7, SC1: 7, B2: 8, TCC2: 9 },
  THU: { TEE1: 0, C1: 1, TD1: 2, TG1: 2, TAA1: 3, ECS: 3, TBB1: 4, CLUB: 4, TE2: 5, SE1: 5, C2: 6, TD2: 7, TG2: 7, A2: 8, TFF2: 9 },
  FRI: { TCC1: 0, TB1: 1, TA1: 2, F1: 3, TE1: 4, SD2: 4, C2: 5, TB2: 6, TA2: 7, F2: 8, TEE2: 9 },
  SAT: { TDD1: 0, E1: 1, SE2: 1, C1: 2, TF1: 3, G1: 3, A1: 4, D2: 5, E2: 6, SD1: 6, TAA2: 7, ECS: 7, TBB2: 8, CLUB: 8, TGG2: 9 },
};

/* ------------------------------------------------------------------ */
/* Lab slot → period index, per day (from the PDF)                    */
/* ------------------------------------------------------------------ */
const LAB_SLOTS = {
  TUE: { L1: 0, L2: 1, L3: 2, L4: 3, L5: 4, L6: 5, L31: 6, L32: 7, L33: 8, L34: 9, L35: 10, L36: 11 },
  WED: { L7: 0, L8: 1, L9: 2, L10: 3, L11: 4, L12: 5, L37: 6, L38: 7, L39: 8, L40: 9, L41: 10, L42: 11 },
  THU: { L13: 0, L14: 1, L15: 2, L16: 3, L17: 4, L18: 5, L43: 6, L44: 7, L45: 8, L46: 9, L47: 10, L48: 11 },
  FRI: { L19: 0, L20: 1, L21: 2, L22: 3, L23: 4, L24: 5, L49: 6, L50: 7, L51: 8, L52: 9, L53: 10, L54: 11 },
  SAT: { L25: 0, L26: 1, L27: 2, L28: 3, L29: 4, L30: 5, L55: 6, L56: 7, L57: 8, L58: 9, L59: 10, L60: 11 },
};

/* theory period index → timeline row, lab period index → timeline row */
const THEORY_ROW = [0, 1, 3, 4, 6, 9, 11, 12, 14, 15];
const LAB_ROW    = [0, 1, 2, 4, 5, 7, 9, 10, 12, 13, 15, 16];

const DAYS = ['TUE', 'WED', 'THU', 'FRI', 'SAT'];

/* ------------------------------------------------------------------ */
/* Course catalog — Winter 2026–27 registered courses                  */
/*   credits = theoryCredits + labCredits                              */
/*   Embedded Theory and Lab = 5 cr (3 theory + 2 lab)                */
/*   STS2011 theory-only      = 1 cr                                   */
/* ------------------------------------------------------------------ */
const COURSES = [
  {
    code: 'MEC3002', name: 'Theory of Machines',
    credits: 4, theoryCredits: 3, labCredits: 1,
    category: 'PC', type: 'Embedded Theory and Lab',
    faculty: [
      'Santosh Kumar Sahu',
      'Rama Sreekanth P S'
    ],
    sections: [
      { code: 'C2+TCC2', venue: 'AB1-G10', faculty: 'Santosh Kumar Sahu', type: 'theory' },
      { code: 'C2+TC2', venue: 'CB-323', faculty: 'Rama Sreekanth P S', type: 'theory' },
      { code: 'C1+TC1', venue: 'CB-315', faculty: 'Rama Sreekanth P S', type: 'theory' },
      { code: 'L9+L10', venue: 'AB2-G01', faculty: 'Santosh Kumar Sahu', type: 'lab' },
      { code: 'L39+L40', venue: 'AB2-G01', faculty: 'Santosh Kumar Sahu', type: 'lab' },
      { code: 'L25+L26', venue: 'AB2-G01', faculty: 'Rama Sreekanth P S', type: 'lab' },
      { code: 'L55+L56', venue: 'AB2-G01', faculty: 'Rama Sreekanth P S', type: 'lab' },
    ],
  },
  {
    code: 'MEC2018', name: 'Thermal Engineering Systems',
    credits: 4, theoryCredits: 3, labCredits: 1,
    category: 'PC', type: 'Embedded Theory and Lab',
    faculty: [
      'Shirin Naresh Patil',
      'Sinha Nishant Ranjan',
      'Mudit Mishra'
    ],
    sections: [
      { code: 'B2+TB2', venue: 'CB-201', faculty: 'Shirin Naresh Patil', type: 'theory' },
      { code: 'B2+TB2', venue: 'CB-214', faculty: 'Sinha Nishant Ranjan', type: 'theory' },
      { code: 'B1+TB1', venue: 'CB-114', faculty: 'Shirin Naresh Patil', type: 'theory' },
      { code: 'L5+L6', venue: 'AB2-G11', faculty: 'Shirin Naresh Patil', type: 'lab' },
      { code: 'L21+L22', venue: 'AB2-G11', faculty: 'Shirin Naresh Patil', type: 'lab' },
      { code: 'L51+L52', venue: 'AB2-G11', faculty: 'Mudit Mishra', type: 'lab' },
      { code: 'L37+L38', venue: 'AB2-G11', faculty: 'Mudit Mishra', type: 'lab' },
    ],
  },
  {
    code: 'MEC2005', name: 'Fundamentals of Manufacturing Processes',
    credits: 4, theoryCredits: 3, labCredits: 1,
    category: 'PC', type: 'Embedded Theory and Lab',
    faculty: [
      'Suyog Jhavar',
      'Manikanta Ravindra Kumar Fakkalagadda',
      'Kishor E'
    ],
    sections: [
      { code: 'D2+TD2', venue: 'CB-325', faculty: 'Suyog Jhavar', type: 'theory' },
      { code: 'D2+TDD2', venue: 'CB-108', faculty: 'Manikanta Ravindra Kumar Fakkalagadda', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-423', faculty: 'Suyog Jhavar', type: 'theory' },
      { code: 'L27+L28', venue: 'AB2-G18', faculty: 'Suyog Jhavar', type: 'lab' },
      { code: 'L3+L4', venue: 'AB2-G18', faculty: 'Suyog Jhavar', type: 'lab' },
      { code: 'L43+L44', venue: 'AB2-G18', faculty: 'Manikanta Ravindra Kumar Fakkalagadda', type: 'lab' },
      { code: 'L31+L32', venue: 'AB2-G18', faculty: 'Kishor E', type: 'lab' },
    ],
  },
  {
    code: 'MEC3011', name: 'Operations and Research',
    credits: 3, theoryCredits: 3, labCredits: 0,
    category: 'PC', type: 'Theory',
    faculty: [
      
    ],
    sections: [
      { code: 'E1+TE1', venue: 'CB-215', faculty: '', type: 'theory' },
      { code: 'E2+TEE2', venue: 'CB-217', faculty: '', type: 'theory' },
    ],
  },
  {
    code: 'MEC4003', name: 'Internal Combustion Engines',
    credits: 4, theoryCredits: 3, labCredits: 1,
    category: 'PC', type: 'Embedded Theory and Lab',
    faculty: [
      'Rajan Deorao Lanjekar'
    ],
    sections: [
      { code: 'F1+TF1', venue: 'CB-220', faculty: 'Rajan Deorao Lanjekar', type: 'theory' },
      { code: 'L33+L34', venue: 'AB2-G11', faculty: 'Rajan Deorao Lanjekar', type: 'lab' },
    ],
  },
  {
    code: 'MAT1010', name: 'Probability and Statistics',
    credits: 4, theoryCredits: 3, labCredits: 1,
    category: 'UC', type: 'Embedded Theory and Lab',
    faculty: [
      'Arun Kumar Yadav',
      'Banoth Veeranna',
      'Bihalan Bhattacharya',
      'Chandan Kumar Thakur',
      'Francis P',
      'Kavya R Nair',
      'Komandla Mahipal Reddy',
      'Lisna PC',
      'Manisha Maity',
      'Moumita Ghosh',
      'Muneeswaran R',
      'N Rajashekar',
      'Parul Saini',
      'Peeyush Singh',
      'Perumandla Karunakar',
      'Piu Kundu',
      'Pradip R. Patle',
      'Prashanth Maroju',
      'Pratik Premadarshi Ray',
      'Ramesh Prasad Panda',
      'Reetika Chawla',
      'Rohit Verma',
      'S V Gomathi',
      'Santanu Mandal',
      'Shalini',
      'Shobhit Kumar Srivastava',
      'Sonali Kaushik',
      'Soumen Kundu',
      'Subhasis Panda',
      'Sudhakar M',
      'Sukanta Nayak',
      'V. Pujitha',
      'Vasili B V Nagarjuna',
      'Yada Nandukumar'
    ],
    sections: [
      { code: 'A2+TA2', venue: 'CB-215', faculty: 'Pratik Premadarshi Ray', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-220', faculty: 'Shobhit Kumar Srivastava', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-316', faculty: 'Ramesh Prasad Panda', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-322', faculty: 'Moumita Ghosh', type: 'theory' },
      { code: 'D2+TDD2', venue: 'CB-113', faculty: 'Yada Nandukumar', type: 'theory' },
      { code: 'D2+TDD2', venue: 'CB-109', faculty: 'Muneeswaran R', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-216', faculty: 'Komandla Mahipal Reddy', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-218', faculty: 'Santanu Mandal', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-115', faculty: 'V. Pujitha', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-214', faculty: 'Sonali Kaushik', type: 'theory' },
      { code: 'D1+TDD1', venue: 'CB-110', faculty: 'Vasili B V Nagarjuna', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-315', faculty: 'Pradip R. Patle', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-119', faculty: 'N Rajashekar', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-201', faculty: 'Francis P', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-219', faculty: 'S V Gomathi', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-319', faculty: 'Perumandla Karunakar', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-324', faculty: 'Subhasis Panda', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-225', faculty: 'Peeyush Singh', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-118', faculty: 'Ramesh Prasad Panda', type: 'theory' },
      { code: 'D1+TDD1', venue: 'CB-213', faculty: 'Banoth Veeranna', type: 'theory' },
      { code: 'D2+TDD2', venue: 'CB-112', faculty: 'Prashanth Maroju', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-220', faculty: 'Pratik Premadarshi Ray', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-119', faculty: 'Piu Kundu', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-111', faculty: 'V. Pujitha', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-114', faculty: 'Chandan Kumar Thakur', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-120', faculty: 'Peeyush Singh', type: 'theory' },
      { code: 'D1+TDD1', venue: 'CB-109', faculty: 'Sonali Kaushik', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-219', faculty: 'Arun Kumar Yadav', type: 'theory' },
      { code: 'D1+TDD1', venue: 'CB-108', faculty: 'S V Gomathi', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-231', faculty: 'Santanu Mandal', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-201', faculty: 'Subhasis Panda', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-217', faculty: 'Sudhakar M', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-407', faculty: 'Prashanth Maroju', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-326', faculty: 'Pradip R. Patle', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-317', faculty: 'Arun Kumar Yadav', type: 'theory' },
      { code: 'D2+TDD2', venue: 'CB-111', faculty: 'Sukanta Nayak', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-230', faculty: 'Shalini', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-418', faculty: 'Sudhakar M', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-408', faculty: 'Perumandla Karunakar', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-120', faculty: 'N Rajashekar', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-327', faculty: 'Shobhit Kumar Srivastava', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-226', faculty: 'Komandla Mahipal Reddy', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-422', faculty: 'Shalini', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-314', faculty: 'Manisha Maity', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-323', faculty: 'Francis P', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-109', faculty: 'Lisna PC', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-325', faculty: 'Piu Kundu', type: 'theory' },
      { code: 'D2+TDD2', venue: 'CB-110', faculty: 'Soumen Kundu', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-118', faculty: 'Soumen Kundu', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-218', faculty: 'Manisha Maity', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-415', faculty: 'Sukanta Nayak', type: 'theory' },
      { code: 'L55+L56', venue: 'CB-106', faculty: 'Chandan Kumar Thakur', type: 'lab' },
      { code: 'L23+L24', venue: 'CB-101', faculty: 'Shalini', type: 'lab' },
      { code: 'L21+L22', venue: 'CB-302', faculty: 'Sudhakar M', type: 'lab' },
      { code: 'L7+L8', venue: 'CB-405', faculty: 'Bihalan Bhattacharya', type: 'lab' },
      { code: 'L1+L2', venue: 'CB-101', faculty: 'Pradip R. Patle', type: 'lab' },
      { code: 'L25+L26', venue: 'CB-102', faculty: 'Perumandla Karunakar', type: 'lab' },
      { code: 'L35+L36', venue: 'CB-105', faculty: 'Rohit Verma', type: 'lab' },
      { code: 'L41+L42', venue: 'CB-101', faculty: 'Moumita Ghosh', type: 'lab' },
      { code: 'L15+L16', venue: 'CB-101', faculty: 'Santanu Mandal', type: 'lab' },
      { code: 'L25+L26', venue: 'CB-101', faculty: 'V. Pujitha', type: 'lab' },
      { code: 'L27+L28', venue: 'CB-121', faculty: 'Pratik Premadarshi Ray', type: 'lab' },
      { code: 'L51+L52', venue: 'CB-302', faculty: 'Prashanth Maroju', type: 'lab' },
      { code: 'L9+L10', venue: 'CB-228', faculty: 'Arun Kumar Yadav', type: 'lab' },
      { code: 'L1+L2', venue: 'CB-102', faculty: 'Shobhit Kumar Srivastava', type: 'lab' },
      { code: 'L27+L28', venue: 'CB-122', faculty: 'N Rajashekar', type: 'lab' },
      { code: 'L29+L30', venue: 'CB-122', faculty: 'Sonali Kaushik', type: 'lab' },
      { code: 'L31+L32', venue: 'CB-101', faculty: 'Prashanth Maroju', type: 'lab' },
      { code: 'L41+L42', venue: 'CB-102', faculty: 'Peeyush Singh', type: 'lab' },
      { code: 'L51+L52', venue: 'CB-301', faculty: 'Pradip R. Patle', type: 'lab' },
      { code: 'L5+L6', venue: 'CB-302', faculty: 'Ramesh Prasad Panda', type: 'lab' },
      { code: 'L47+L48', venue: 'CB-102', faculty: 'Parul Saini', type: 'lab' },
      { code: 'L9+L10', venue: 'CB-301', faculty: 'Shalini', type: 'lab' },
      { code: 'L13+L14', venue: 'CB-105', faculty: 'Ramesh Prasad Panda', type: 'lab' },
      { code: 'L21+L22', venue: 'CB-303', faculty: 'Banoth Veeranna', type: 'lab' },
      { code: 'L33+L34', venue: 'AB2-114', faculty: 'Moumita Ghosh', type: 'lab' },
      { code: 'L35+L36', venue: 'CB-106', faculty: 'Reetika Chawla', type: 'lab' },
      { code: 'L3+L4', venue: 'CB-121', faculty: 'Yada Nandukumar', type: 'lab' },
      { code: 'L45+L46', venue: 'AB2-114', faculty: 'Vasili B V Nagarjuna', type: 'lab' },
      { code: 'L53+L54', venue: 'CB-101', faculty: 'Pratik Premadarshi Ray', type: 'lab' },
      { code: 'L19+L20', venue: 'CB-416', faculty: 'Arun Kumar Yadav', type: 'lab' },
      { code: 'L39+L40', venue: 'CB-102', faculty: 'N Rajashekar', type: 'lab' },
      { code: 'L3+L4', venue: 'CB-321', faculty: 'Francis P', type: 'lab' },
      { code: 'L53+L54', venue: 'CB-102', faculty: 'Komandla Mahipal Reddy', type: 'lab' },
      { code: 'L5+L6', venue: 'CB-122', faculty: 'Chandan Kumar Thakur', type: 'lab' },
      { code: 'L7+L8', venue: 'CB-321', faculty: 'Kavya R Nair', type: 'lab' },
      { code: 'L39+L40', venue: 'CB-101', faculty: 'Sonali Kaushik', type: 'lab' },
      { code: 'L11+L12', venue: 'CB-202', faculty: 'Komandla Mahipal Reddy', type: 'lab' },
      { code: 'L37+L38', venue: 'CB-121', faculty: 'Shobhit Kumar Srivastava', type: 'lab' },
      { code: 'L47+L48', venue: 'CB-101', faculty: 'Subhasis Panda', type: 'lab' },
      { code: 'L13+L14', venue: 'CB-102', faculty: 'Manisha Maity', type: 'lab' },
      { code: 'L15+L16', venue: 'CB-102', faculty: 'Subhasis Panda', type: 'lab' },
      { code: 'L19+L20', venue: 'CB-101', faculty: 'Piu Kundu', type: 'lab' },
      { code: 'L31+L32', venue: 'CB-102', faculty: 'Perumandla Karunakar', type: 'lab' },
      { code: 'L11+L12', venue: 'CB-122', faculty: 'Piu Kundu', type: 'lab' },
      { code: 'L57+L58', venue: 'CB-409', faculty: 'Soumen Kundu', type: 'lab' },
      { code: 'L43+L44', venue: 'CB-105', faculty: 'Soumen Kundu', type: 'lab' },
      { code: 'L29+L30', venue: 'CB-202', faculty: 'S V Gomathi', type: 'lab' },
      { code: 'L23+L24', venue: 'CB-102', faculty: 'Sukanta Nayak', type: 'lab' },
      { code: 'L45+L46', venue: 'AB2-301', faculty: 'Lisna PC', type: 'lab' },
      { code: 'L43+L44', venue: 'CB-106', faculty: 'Sukanta Nayak', type: 'lab' },
      { code: 'L55+L56', venue: 'CB-121', faculty: 'S V Gomathi', type: 'lab' },
      { code: 'L33+L34', venue: 'AB2-119', faculty: 'Francis P', type: 'lab' },
      { code: 'L49+L50', venue: 'CB-101', faculty: 'Manisha Maity', type: 'lab' },
      { code: 'L37+L38', venue: 'CB-106', faculty: 'V. Pujitha', type: 'lab' },
      { code: 'L49+L50', venue: 'CB-102', faculty: 'Peeyush Singh', type: 'lab' },
    ],
  },
  {
    code: 'MGT1040', name: 'Entrepreneurship',
    credits: 4, theoryCredits: 3, projectCredits: 1, labCredits: 0,
    category: 'UC', type: 'Embedded Theory and Project',
    faculty: [
      'A S Arunkumar',
      'Aditya Muppa',
      'Ajmal S Rasaq',
      'Amrita Purakayastha',
      'Bhavna Thawani',
      'Devarapalli Suman',
      'Dripta De Joarder',
      'Ishfaq Ahmad Thaku',
      'Karishma Bisht',
      'Kashif Beg',
      'N.Prabhakar',
      'Rajarshi Sarkar',
      'Rajashree Naik',
      'Ramshin Rahiman',
      'Ritambhara Sharma',
      'Senthamizhselvi.A',
      'Shaiku Shahida Saheb',
      'Triveni Rajashekhar',
      'Umer Mushtaq lone',
      'Vadithe Rakesh Naik'
    ],
    sections: [
      { code: 'F2+TF2', venue: 'CB-G15', faculty: 'Umer Mushtaq lone', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-G11', faculty: 'Kashif Beg', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-G12', faculty: 'Shaiku Shahida Saheb', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-114', faculty: 'Senthamizhselvi.A', type: 'theory' },
      { code: 'F2+TFF2', venue: 'AB1-134', faculty: 'Senthamizhselvi.A', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-115', faculty: 'N.Prabhakar', type: 'theory' },
      { code: 'F1+TF1', venue: 'CB-G13', faculty: 'Ishfaq Ahmad Thaku', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-G17', faculty: 'Ishfaq Ahmad Thaku', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-119', faculty: 'Devarapalli Suman', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-G18', faculty: 'Bhavna Thawani', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-G13', faculty: 'Ritambhara Sharma', type: 'theory' },
      { code: 'F1+TFF1', venue: 'AB1-G10', faculty: 'Ritambhara Sharma', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-120', faculty: 'Rajashree Naik', type: 'theory' },
      { code: 'F1+TF1', venue: 'CB-G14', faculty: 'Rajashree Naik', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-215', faculty: 'Rajarshi Sarkar', type: 'theory' },
      { code: 'F1+TF1', venue: 'CB-226', faculty: 'Rajarshi Sarkar', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-216', faculty: 'Triveni Rajashekhar', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-217', faculty: 'Dripta De Joarder', type: 'theory' },
      { code: 'F1+TF1', venue: 'CB-317', faculty: 'Dripta De Joarder', type: 'theory' },
      { code: 'F1+TF1', venue: 'CB-230', faculty: 'Karishma Bisht', type: 'theory' },
      { code: 'F1+TF1', venue: 'CB-231', faculty: 'Ajmal S Rasaq', type: 'theory' },
      { code: 'F2+TF2', venue: 'CB-231', faculty: 'Ajmal S Rasaq', type: 'theory' },
      { code: 'F2+TF2', venue: 'CB-314', faculty: 'Amrita Purakayastha', type: 'theory' },
      { code: 'F2+TF2', venue: 'CB-315', faculty: 'A S Arunkumar', type: 'theory' },
      { code: 'F1+TFF1', venue: 'AB1-G02', faculty: 'A S Arunkumar', type: 'theory' },
      { code: 'F2+TF2', venue: 'CB-316', faculty: 'Ramshin Rahiman', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-119', faculty: 'Aditya Muppa', type: 'theory' },
      { code: 'F2+TFF2', venue: 'AB1-G10', faculty: 'Aditya Muppa', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-G16', faculty: 'Ramshin Rahiman', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-118', faculty: 'Rajarshi Sarkar', type: 'theory' },
      { code: 'F2+TF2', venue: 'CB-230', faculty: 'Vadithe Rakesh Naik', type: 'theory' },
    ],
  },
  {
    code: 'STS2011', name: 'Qualitative and Quantitative Skills Practice',
    credits: 1, theoryCredits: 1, labCredits: 0,
    category: 'UC', type: 'Theory Only',
    faculty: [
      'Deva Naveen Kumar',
      'Gowrabathinatanoj',
      'K Mani',
      'Kumaran R',
      'Mamatha',
      'Manikandan S',
      'Prashanth Kumar',
      'Prof Musthaq',
      'Prof Sumanth',
      'Prof.Six Phrase Faculty-9',
      'Rakshitha Karra',
      'Ramesh',
      'Sujitha',
      'Swetha'
    ],
    sections: [
      { code: 'A1+TA1', venue: 'CB-325', faculty: 'Prof Sumanth', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-322', faculty: 'Gowrabathinatanoj', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-323', faculty: 'Prashanth Kumar', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-324', faculty: 'Gowrabathinatanoj', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-318B', faculty: 'Prof Sumanth', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-319', faculty: 'Kumaran R', type: 'theory' },
      { code: 'B1+TB1', venue: 'CB-219', faculty: 'Prof Sumanth', type: 'theory' },
      { code: 'B1+TB1', venue: 'CB-220', faculty: 'Prof Musthaq', type: 'theory' },
      { code: 'B2+TB2', venue: 'CB-225', faculty: 'Prof Sumanth', type: 'theory' },
      { code: 'B2+TB2', venue: 'CB-226', faculty: 'Prof Musthaq', type: 'theory' },
      { code: 'C1+TC1', venue: 'CB-317', faculty: 'K Mani', type: 'theory' },
      { code: 'C1+TCC1', venue: 'CB-111', faculty: 'Mamatha', type: 'theory' },
      { code: 'C2+TCC2', venue: 'CB-111', faculty: 'Prashanth Kumar', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-426', faculty: 'Deva Naveen Kumar', type: 'theory' },
      { code: 'D1+TDD1', venue: 'CB-G11', faculty: 'Swetha', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-408', faculty: 'Swetha', type: 'theory' },
      { code: 'D2+TDD2', venue: 'CB-215', faculty: 'K Mani', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-G16', faculty: 'Deva Naveen Kumar', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-220', faculty: 'Deva Naveen Kumar', type: 'theory' },
      { code: 'B1+TB1', venue: 'CB-218', faculty: 'Sujitha', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-225', faculty: 'Swetha', type: 'theory' },
      { code: 'B2+TB2', venue: 'CB-219', faculty: 'Gowrabathinatanoj', type: 'theory' },
      { code: 'B2+TB2', venue: 'CB-220', faculty: 'Kumaran R', type: 'theory' },
      { code: 'F1+TF1', venue: 'CB-G16', faculty: 'Deva Naveen Kumar', type: 'theory' },
      { code: 'C1+TC1', venue: 'CB-316', faculty: 'Kumaran R', type: 'theory' },
      { code: 'F1+TF1', venue: 'CB-314', faculty: 'Swetha', type: 'theory' },
      { code: 'F2+TF2', venue: 'CB-G17', faculty: 'Swetha', type: 'theory' },
      { code: 'C2+TC2', venue: 'CB-324', faculty: 'Sujitha', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-425', faculty: 'Kumaran R', type: 'theory' },
      { code: 'D1+TDD1', venue: 'CB-216', faculty: 'Prashanth Kumar', type: 'theory' },
      { code: 'C2+TC2', venue: 'CB-513', faculty: 'Swetha', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-407', faculty: 'Manikandan S', type: 'theory' },
      { code: 'F2+TF2', venue: 'CB-317', faculty: 'Deva Naveen Kumar', type: 'theory' },
      { code: 'D2+TDD2', venue: 'CB-214', faculty: 'Sujitha', type: 'theory' },
      { code: 'F2+TFF2', venue: 'CB-111', faculty: 'K Mani', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-201', faculty: 'Sujitha', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-218', faculty: 'Prashanth Kumar', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-219', faculty: 'Sujitha', type: 'theory' },
      { code: 'F1+TFF1', venue: 'CB-G12', faculty: 'Manikandan S', type: 'theory' },
      { code: 'F2+TF2', venue: 'CB-G16', faculty: 'Manikandan S', type: 'theory' },
      { code: 'C1+TCC1', venue: 'AB2-105', faculty: 'Sujitha', type: 'theory' },
      { code: 'C2+TCC2', venue: 'AB2-G19', faculty: 'Mamatha', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-G14', faculty: 'Kumaran R', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-G15', faculty: 'Gowrabathinatanoj', type: 'theory' },
      { code: 'F1+TF1', venue: 'CB-G15', faculty: 'Rakshitha Karra', type: 'theory' },
      { code: 'B1+TB1', venue: 'CB-217', faculty: 'Kumaran R', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-326', faculty: 'Prof Musthaq', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-323', faculty: 'Prof Musthaq', type: 'theory' },
      { code: 'A1+TA1', venue: 'CB-327', faculty: 'Prof.Six Phrase Faculty-9', type: 'theory' },
      { code: 'A2+TA2', venue: 'CB-324', faculty: 'Ramesh', type: 'theory' },
      { code: 'B1+TB1', venue: 'CB-225', faculty: 'Ramesh', type: 'theory' },
      { code: 'B2+TB2', venue: 'CB-524', faculty: 'Prof.Six Phrase Faculty-9', type: 'theory' },
      { code: 'C1+TC1', venue: 'CB-319', faculty: 'Prof.Six Phrase Faculty-9', type: 'theory' },
      { code: 'C2+TC2', venue: 'CB-514', faculty: 'Prof.Six Phrase Faculty-9', type: 'theory' },
      { code: 'D1+TD1', venue: 'CB-429', faculty: 'Ramesh', type: 'theory' },
      { code: 'D2+TD2', venue: 'CB-415', faculty: 'Ramesh', type: 'theory' },
      { code: 'E1+TE1', venue: 'CB-213', faculty: 'Ramesh', type: 'theory' },
      { code: 'E2+TE2', venue: 'CB-226', faculty: 'Prof.Six Phrase Faculty-9', type: 'theory' },
      { code: 'F1+TFF1', venue: 'CB-G11', faculty: 'Prof.Six Phrase Faculty-9', type: 'theory' },
      { code: 'F2+TFF2', venue: 'CB-110', faculty: 'Ramesh', type: 'theory' },
    ],
  },
];
