export type TaskStatus = "TODO" | "IN_PROGRESS" | "DONE";

export interface SemesterWithCount {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  _count: {
    subjects: number;
  };
}

export interface SemesterWithSubjects {
  id: string;
  name: string;
  startDate: string | null;
  endDate: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  subjects: SubjectWithCounts[];
}

export interface SubjectWithCounts {
  id: string;
  title: string;
  description: string | null;
  semesterId: string;
  order: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  _count: {
    materials: number;
    tasks: number;
  };
  taskStats?: {
    total: number;
    done: number;
  };
}

export interface ClassScheduleData {
  id: string;
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room: string | null;
  className: string | null;
  lecturer: string | null;
  order: number;
  createdAt: string;
  updatedAt: string;
  subject?: {
    id: string;
    title: string;
    semesterId: string;
    semester?: {
      id: string;
      name: string;
    };
  };
}

export interface SubjectDetail {
  id: string;
  title: string;
  description: string | null;
  semesterId: string;
  semester: { id: string; name: string };
  order: number;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
  materials: MaterialSummary[];
  notes: SubjectNoteSummary[];
  tasks: TaskSummary[];
  attachments: AttachmentData[];
}

export interface SubjectNoteSummary {
  id: string;
  title: string | null;
  content: string;
  subjectId: string;
  pinned: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface SubjectNoteDetail {
  id: string;
  title: string | null;
  content: string;
  subjectId: string;
  subject: {
    id: string;
    title: string;
    semesterId: string;
    semester: { id: string; name: string };
  };
  pinned: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialSummary {
  id: string;
  title: string | null;
  meetingNumber: number;
  pinned: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  tags: TagData[];
  _count: { attachments: number };
}

export interface MaterialDetail {
  id: string;
  title: string | null;
  meetingNumber: number;
  content: string;
  subjectId: string;
  subject: {
    id: string;
    title: string;
    semesterId: string;
    semester: { id: string; name: string };
  };
  pinned: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
  tags: TagData[];
  attachments: AttachmentData[];
}

export interface TaskSummary {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: TaskStatus;
  order: number;
  createdAt: string;
  updatedAt: string;
  tags: TagData[];
  _count: { attachments: number };
  subject?: {
    id: string;
    title: string;
    semesterId: string;
  };
}

export interface TaskDetail {
  id: string;
  title: string;
  description: string | null;
  deadline: string | null;
  status: TaskStatus;
  subjectId: string;
  subject: {
    id: string;
    title: string;
    semesterId: string;
    semester: { id: string; name: string };
  };
  order: number;
  createdAt: string;
  updatedAt: string;
  tags: TagData[];
  attachments: AttachmentData[];
}

export interface TagData {
  id: string;
  name: string;
  color: string;
}

export interface AttachmentData {
  id: string;
  fileName: string;
  filePath: string;
  fileSize: number;
  fileType: string;
  displayName?: string | null;
  description?: string | null;
  tags?: string | null;
  createdAt: string;
}

export interface SearchResult {
  materials: MaterialSummary[];
  tasks: TaskSummary[];
  notes: (SubjectNoteSummary & {
    subject?: {
      id: string;
      title: string;
      semesterId: string;
    };
  })[];
}

export type RecentActivityType = "TASK" | "MATERIAL" | "NOTE";

export interface RecentActivityItem {
  id: string;
  type: RecentActivityType;
  title: string;
  updatedAt: string;
  subject: {
    id: string;
    title: string;
    semesterId: string;
  };
}

export interface ReorderItem {
  id: string;
  order: number;
}

export interface SidebarSemester {
  id: string;
  name: string;
  subjects: {
    id: string;
    title: string;
    semesterId: string;
  }[];
}
