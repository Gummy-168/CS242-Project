# CS242-Project
    "Student may not know how to prioritize tasks when deadlines overlap"

# ที่มาของปัญหา
## Pain point 
    เนื่องจากหลายงานอาจมีกำหนดส่งใกล้กัน 
    1. นักศึกษาอาจไม่รู้ว่าวิชาไหนส่งงานก่อนหรือหลัง
    2. นักศึกษาอาจไม่เห็นภาพรวมของงานเมื่องานกระจายอยู่ในหลายช่องทาง
    3. นักศึกษาอาจพลาดการส่งงานได้
    
# แนวทางการแก้ไข
    เราสร้างแนวทางการแก้ไขโดยสร้างเว็บที่มีฟีเจอร์การแจ้งเตือนเพื่อให้นัก
    ศึกษาได้รับรู้ถึงกำหนดส่งของแต่ละงาน และสร้างหน้าแสดง tasks 2 รูปแบบคือแบบตารางและปฏิทิน เพื่อให้นักศึกษาสามารถดูภาพรวมกำหนดส่งงานได้ 

# ประโยชน์ที่จะได้รับ
    1. ทำให้นักศึกษาสามารถเห็นภาพรวมเวลาการส่งงานผ่านรูปแบบตารางหรือปฏิทินได้
    2. ทำให้นักศึกษาสามารถเห็นงานที่เพิ่มในเว็บ ผ่าน google calendar ได้
    3. ทำให้ได้รับการแจ้งเตือนเมื่องานใกล้ถึง deadline ทุกๆ 1, 3, 5 หรือ 7 วัน 

# สถาปัตยกรรมระบบและแนวคิดการออกแบบ
    


# Class Diagram (UML)
    classDiagram
    %% ==================================================
    %% Enumerations
    %% ==================================================
    class AssignmentStatus {
        <<enumeration>>
        PENDING
        IN_PROGRESS
        COMPLETED
        OVERDUE
    }

    class AssignmentPriority {
        <<enumeration>>
        LOW
        MEDIUM
        HIGH
    }

    class AccountStatus {
        <<enumeration>>
        ACTIVE
        INACTIVE
        SUSPENDED
    }

    %% ==================================================
    %% Core Models (Database Layer)
    %% ==================================================
    class User {
        +int id
        +string email
        +string username
        +string password_hash
        +AccountStatus account_status
        +datetime created_at
        +datetime updated_at
        --
        +bool login(str email, str password)
        +None logout()
        +string get_email()
        +void set_email(str email)
        +string get_username()
        +void set_username(str username)
        +int get_id()
        +bool authenticate_pw(str password)
        +bool validate_account_status()
        +static register_user(int id, str email, str username, str password) User
    }

    class Course {
        +int id
        +int user_id
        +string course_name
        +string instructor_name
        +string semester
        +datetime created_at
        +datetime updated_at
        +list assignments
        --
        +str get_course_name()
        +void set_course_name(str course_name)
        +bool validate_course_name()
        +void add_assignment(Assignment assignment)
        +void remove_assignment(int assignment_id)
        +list get_all_assignments()
    }

    class Assignment {
        +int id
        +int user_id
        +int course_id
        +string title
        +string description
        +datetime deadline
        +AssignmentPriority priority
        +AssignmentStatus status
        +string tag_color
        +float score
        +float score_total
        +int difficulty
        +string calendar_event_id
        +datetime created_at
        +datetime updated_at
        --
        +str course_name()
        +str get_title()
        +void set_title(str title)
        +AssignmentStatus get_status()
        +void set_status(AssignmentStatus status)
        +void mark_complete()
        +bool is_overdue(datetime current_time)
        +int days_remaining(datetime current_time)
        +void update_priority(AssignmentPriority priority)
        +bool validate_deadline()
        +bool validate_status_transition(AssignmentStatus new_status)
    }

    %% ==================================================
    %% Supporting Models
    %% ==================================================
    class WorkspaceSubject {
        +int id
        +int user_id
        +string name
        +string color
        +datetime created_at
        +datetime updated_at
        --
        +void set_name(str name)
        +void set_color(str color)
    }

    class UserNotificationSetting {
        +int user_id
        +bool email_enabled
        +bool notify_1_day
        +bool notify_3_days
        +bool notify_5_days
        +bool notify_7_days
        +datetime created_at
        +datetime updated_at
        --
        +list enabled_days()
    }

    class NotificationLog {
        +int id
        +int user_id
        +int assignment_id
        +int days_before_deadline
        +datetime sent_at
        --
    }

    class GoogleCalendarToken {
        +int id
        +int user_id
        +string access_token
        +string refresh_token
        +string token_type
        +string scope
        +datetime expires_at
        +datetime created_at
        +datetime updated_at
        --
    }

    %% ==================================================
    %% Logic & Services (Business Layer)
    %% ==================================================
    class AssignmentManager {
        +list _assignments
        +list _courses
        --
        +Assignment create_assignment(...)
        +Assignment | None edit_assignment(int id, object updates)
        +bool delete_assignment(int id)
        +list filter_by_course(int course_id)
        +list sort_by_deadline(bool ascending)
        +list get_upcoming_assignments(int user_id)
        +AssignmentStatistics calculate_workload_summary()
        +list search_assignments(str query)
    }

    class ReminderService {
        --
        +static from_env(str type, int days) ReminderService
        +bool validate_email_config()
        +datetime schedule_notification(Assignment assignment)
        +bool send_reminder(Assignment assignment, str email)
        +dict sync_to_calendar(list assignments)
    }

    class google_calendar_service {
        --
        +str get_google_auth_url(int user_id)
        +GoogleCalendarToken exchange_code_for_token(Session db, int user_id, str code)
        +str upsert_assignment_event(Session db, Assignment assignment)
        +None delete_assignment_event(Session db, Assignment assignment)
        +int sync_user_assignments(Session db, int user_id)
    }

    class pandas_analytics_service {
        --
        +dict get_task_insights(Session db, int user_id)
    }

    %% ==================================================
    %% Relationships
    %% ==================================================
    %% Database Associations (Solid Lines)
    User "1" -- "*" Course : owns
    User "1" -- "*" Assignment : owns
    Course "1" -- "*" Assignment : contains
    User "1" -- "1" UserNotificationSetting : configures
    User "1" -- "1" GoogleCalendarToken : authenticates
    User "1" -- "*" WorkspaceSubject : manages
    Assignment "1" -- "*" NotificationLog : tracks
    User "1" -- "*" NotificationLog : sent_logs

    %% Service Dependencies (Dashed Lines)
    AssignmentManager ..> Assignment : manages
    ReminderService ..> Assignment : sends_reminders
    google_calendar_service ..> Assignment : syncs_to_events
    google_calendar_service ..> GoogleCalendarToken : uses_token
    pandas_analytics_service ..> Assignment : analyzes_data

# ผลการดำเนินงาน
    1. สามารถให้นักศึกษาเพิ่มงานผ่านเว็บได้
    2. สามารถเชื่อมต่องานกับ google calendar ได้
    3. สามารถแจ้งเตือนงานกับนักศึกษาได้ ทุกๆ 1, 3, 5 หรือ 7 วัน ตามที่นักศึกษาได้ตั้งค่าไว้ได้ 
    
# การแจกแจงงานที่สมาชิกแต่ละคนรับผิดชอบ
    นายพนธกร เกษมสวัสดิ์ 6709616665        ทำหน้าที่
    นางสาวสิริยากร พูนสินโภคทรัพย์ 6709616939 ทำหน้าที่พัฒนาและออกแบบหน้าเว็บฝั่ง frontend
    นายรัฐภูมิ แสงคำมา 6709616848           ทำหน้าที่
    นายศุภณัฐ แก่นท้าว 6709616905           ทำหน้าที่
    นางสาวโชติกา พัฒนาวิจิตร 6709681073     ทำหน้าที่พัฒนาและออกแบบหน้าเว็บฝั่ง frontend
    นายกนกพจน์ กาญจนประทุม 6709620022    ทำหน้าที่
