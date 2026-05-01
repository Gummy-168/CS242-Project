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
        +str course_name()
        +str get_title()
        +void set_title(str)
        +AssignmentStatus get_status()
        +void set_status(AssignmentStatus)
        +void mark_complete()
        +bool is_overdue(datetime | None)
        +int days_remaining(datetime | None)
        +void update_priority(AssignmentPriority)
        +bool validate_deadline()
        +bool validate_status_transition(AssignmentStatus)
    }

    class Course {
        +int id
        +int user_id
        +string course_name
        +string instructor_name
        +string semester
        +datetime created_at
        +datetime updated_at
        +list[Assignment] assignments
        +str get_course_name()
        +void set_course_name(str)
        +bool validate_course_name()
        +void add_assignment(Assignment)
        +void remove_assignment(int)
        +list[Assignment] get_all_assignments()
    }

    class User {
        +int id
        +string email
        +string username
        +string password
        +AccountStatus account_status
        +datetime created_at
        +datetime updated_at
        +bool login(str, str)
        +None logout()
        +string get_email()
        +void set_email(str)
        +string get_username()
        +void set_username(str)
        +int get_id()
        +bool authenticate_pw(str)
        +bool validate_account_status()
        +classmethod register_user(int, str, str, str) User
    }

    class NotificationLog {
        +int id
        +int user_id
        +int assignment_id
        +int days_before_deadline
        +datetime sent_at
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
        +list[int] enabled_days()
    }

    class WorkspaceSubject {
        +int id
        +int user_id
        +string name
        +string color
        +datetime created_at
        +datetime updated_at
        +User user
        +void set_name(str)
        +void set_color(str)
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
    }

    class AssignmentManager {
        +__init__(list[Assignment] | None, list[Course] | None)
        +Assignment create_assignment(int, str, str, datetime, int, AssignmentStatus, int, float, str)
        +Assignment | None edit_assignment(int, **object)
        +bool delete_assignment(int)
        +list[Assignment] filter_by_course(int)
        +list[Assignment] sort_by_deadline(bool)
        +list[Assignment] get_upcoming_assignments(int)
        +list[Assignment] get_overdue_assignments()
        +AssignmentStatistics calculate_workload_summary()
        +list[Assignment] search_assignments(str)
        +list[Assignment] filter_by_status(AssignmentStatus)
        +dict[str, list[Assignment]] get_calendar_data()
    }

    class AssignmentStatistics {
        +__init__(int, int, int, int)
        +int get_pending_count()
        +None set_pending_count(int)
        +int calculate_remaining_assignments(list[Assignment])
        +bool verify_counter_sync(list[Assignment])
    }

    class ReminderService {
        +__init__(str, int, str, str, str, int, str | None, bool)
        +classmethod from_env(str, int) ReminderService
        +bool validate_email_config()
        +datetime schedule_notification(Assignment)
        +bool validate_reminder_settings()
        +bool send_email_notification(str, str, str)
        +bool send_reminder(Assignment, str)
        +dict[str, list[datetime]] sync_to_calendar(list[Assignment])
    }

    class auto_reminder_service {
        +UserNotificationSetting get_or_create_notification_setting(Session, int)
        +UserNotificationSetting update_notification_setting(Session, int, bool, list[int])
        +tuple[str, str] _build_reminder_message(Assignment, int)
        +int process_automatic_reminders(Session, datetime | None)
    }

    class google_calendar_service {
        +str _require_env(str)
        +dict[str, Any] _post_form(str, dict[str, str])
        +dict[str, Any] _request_json(str, str, str, dict[str, Any] | None)
        +str get_google_auth_url(int)
        +GoogleCalendarToken exchange_code_for_token(Session, int, str)
        +GoogleCalendarToken _refresh_access_token(Session, GoogleCalendarToken)
        +str _get_valid_access_token(Session, int)
        +dict[str, Any] _assignment_to_event_payload(Session, Assignment)
        +str upsert_assignment_event(Session, Assignment)
        +None delete_assignment_event(Session, Assignment)
        +int sync_user_assignments(Session, int)
        +int disconnect_google_calendar(Session, int)
    }

    class calendar_service {
        +dict[str, object] _serialize_assignment(Assignment)
        +list[dict[str, object]] get_calendar_assignments(int | None)
        +list[dict[str, object]] get_today_assignments(int | None)
    }

    class pandas_analytics_service {
        +dict[str, object] get_task_insights(Session, int)
    }

    class main {
        +NotificationSettingsResponse serialize_notification_setting(object)
        +dict[str, object] register_user(RegisterRequest, Session)
        +dict[str, object] login_user(LoginRequest, Session)
        +Assignment create_assignment(AssignmentCreate, Session)
        +list[Assignment] get_assignments(int, Session)
        +TaskInsightsResponse get_statistics_task_insights(int, Session)
        +Assignment get_assignment_by_id(int, Session)
        +Assignment update_assignment_status(int, AssignmentStatusUpdate, Session)
        +Assignment update_assignment(AssignmentUpdate, Session)
        +dict[str, str] delete_assignment(int, Session)
        +dict[str, object] send_due_reminders(ReminderSendRequest, Session)
        +NotificationSettingsResponse get_notification_settings(int, Session)
        +NotificationSettingsResponse save_notification_settings(NotificationSettingsUpdateRequest, int, Session)
        +dict[str, str] google_calendar_connect_url(int)
        +dict[str, str] google_calendar_exchange_code(dict[str, object], Session)
        +dict[str, int] google_calendar_sync_all(int, Session)
        +dict[str, int] google_calendar_disconnect(int, Session)
        +WorkspaceSubject create_workspace_subject(WorkspaceSubjectCreate, Session)
        +list[WorkspaceSubject] get_workspace_subjects(int | None, Session)
        +WorkspaceSubject update_workspace_subject(int, WorkspaceSubjectUpdate, Session)
        +dict[str, str] delete_workspace_subject(int, Session)
        +dict[str, str] db_test()
    }

    class AssignmentStatus {
        +PENDING
        +IN_PROGRESS
        +COMPLETED
        +OVERDUE
    }

    class AssignmentPriority {
        +LOW
        +MEDIUM
        +HIGH
    }

    class AccountStatus {
        +ACTIVE
        +INACTIVE
        +SUSPENDED
    }

    User "1" -- "*" Assignment : owns
    Course "1" -- "*" Assignment : contains
    User "1" -- "*" Course : owns
    Assignment "1" -- "*" NotificationLog : notifications
    User "1" -- "*" NotificationLog : sent_logs
    User "1" -- "1" UserNotificationSetting : notification_setting
    User "1" -- "1" GoogleCalendarToken : google_calendar_token
    User "1" -- "*" WorkspaceSubject : workspace_subjects
    Course "1" -- "*" Assignment : assignments

    main --> User
    main --> Assignment
    main --> Course
    main --> NotificationLog
    main --> UserNotificationSetting
    main --> WorkspaceSubject
    main --> GoogleCalendarToken
    main --> ReminderService
    main --> google_calendar_service
    main --> auto_reminder_service
    main --> pandas_analytics_service

    ReminderService --> Assignment
    google_calendar_service --> Assignment
    google_calendar_service --> User
    google_calendar_service --> GoogleCalendarToken
    auto_reminder_service --> UserNotificationSetting
    auto_reminder_service --> User
    auto_reminder_service --> Assignment
    pandas_analytics_service --> Assignment
    calendar_service --> Assignment

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