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
    1. วัตถุประสงค์ของโครงการ (Project Goal)
        โครงการนี้คือระบบจัดการงานและกิจกรรม (Assignment and Task Management System) สำหรับนักศึกษา โดยตัวระบบจะช่วยให้ผู้ใช้สามารถสร้าง, อัปเดต, เรียกดู, จัดระเบียบ และติดตามงานจากวิชาต่าง ๆ ได้ในที่เดียว 
        นอกจากนี้ยังรองรับระบบแจ้งเตือนผ่านอีเมลตามกำหนดส่ง (Deadline), ระบบวิเคราะห์ข้อมูล (Analytics) และการเชื่อมต่อกับ Google Calendar

    2. สถาปัตยกรรมระดับสูง (High-Level Architecture)
        ระบบใช้สถาปัตยกรรมแบบ Client-Server ร่วมกับการจัดเก็บข้อมูลแบบถาวร (Persistent Storage) โดยแบ่งเป็นชั้นดังนี้:
            ชั้น Frontend: พัฒนาด้วย Next.js/React ทำหน้าที่จัดการส่วนปฏิสัมพันธ์กับผู้ใช้ (User Interaction), ระบบ Routing, แถบเมนูข้าง (Sidebar), ฟอร์มกรอกข้อมูลงาน, หน้า Dashboard, การตั้งค่า และหน้าวิเคราะห์ข้อมูล
            ชั้น Backend: พัฒนาด้วย FastAPI ทำหน้าที่ให้บริการ REST APIs สำหรับระบบยืนยันตัวตน, จัดการงาน (Assignments), หัวข้อ Workspace, การตั้งค่าการแจ้งเตือน, ระบบวิเคราะห์ข้อมูล และการเชื่อมต่อกับ Google Calendar
            ชั้น Service: แยกส่วนตรรกะทางธุรกิจ (Business Logic) ออกเป็นโมดูลเฉพาะ เช่น การจัดการการแจ้งเตือน, การจัดตารางเวลาแจ้งเตือนอัตโนมัติ, การซิงค์ข้อมูลกับ Google Calendar และการวิเคราะห์ข้อมูลด้วย pandas
            ชั้น Data: ใช้ MySQL เป็นฐานข้อมูลหลัก โดยใช้ SQLAlchemy (ORM) ในการแมปคลาสภาษา Python เข้ากับตารางในฐานข้อมูล และใช้ Docker Volumes เพื่อให้ข้อมูลยังคงอยู่แม้ระบบจะหยุดทำงาน

    3. ส่วนประกอบหลักทางสถาปัตยกรรม
        3.1 Frontend
            รับผิดชอบในส่วนของ:
                การลงทะเบียนและเข้าสู่ระบบของผู้ใช้
                หน้าแสดงรายการงานและ Dashboard
                ส่วนติดต่อผู้ใช้ (UI) สำหรับการตั้งค่าการแจ้งเตือน
                น้าแสดงปฏิทินและผลวิเคราะห์ข้อมูล
                การเรียกใช้ API จาก Backend และแสดงผลข้อมูลที่ได้รับ
        3.2 Backend API
            ทำหน้าที่เป็นตัวควบคุมแอปพลิเคชัน (Application Controller) และให้บริการ Endpoint สำหรับ:
                ระบบลงทะเบียนและเข้าสู่ระบบ
                การสร้าง, อัปเดต, อ่าน และลบข้อมูลงาน (CRUD Assignments)
                จัดการหัวข้อใน Workspace
                บันทึกและโหลดการตั้งค่าการแจ้งเตือน
                การส่งคำสั่งแจ้งเตือนและรันโปรเซสแจ้งเตือนอัตโนมัติ
                ให้บริการข้อมูลการวิเคราะห์ เช่น การกระจายลำดับความสำคัญของงาน (Priority Distribution) และงานที่ใกล้ถึงกำหนดส่ง
                การเชื่อมต่อและซิงค์ข้อมูลกับ Google Calendar
        3.3 ฐานข้อมูล (Database)
                จัดเก็บข้อมูลถาวรในตาราง MySQL เช่น:
                    users, assignments, courses, reminders, workspace_subjects, google_calendar_tokens, user_notification_settings และ notification_logs
                    
    4. แนวคิดการออกแบบ (Design Concept)
        ระบบถูกออกแบบตามหลักการ Layered and Modular Design:
            Presentation Layer: Frontend รับผิดชอบเฉพาะส่วนการปฏิสัมพันธ์กับผู้ใช้และการแสดงผลเท่านั้น
            Application/API Layer: FastAPI Routes ทำหน้าที่รับคำขอ (Requests), ตรวจสอบความถูกต้องของข้อมูล (Validation) และเรียกใช้ Service ที่เกี่ยวข้อง
            Business Logic Layer: Services จัดเก็บกฎเกณฑ์ของแอปพลิเคชัน เช่น เงื่อนไขการส่งการแจ้งเตือน, วิธีการสร้างข้อมูลวิเคราะห์ และการซิงค์ข้อมูลกับภายนอก
            Persistence Layer: ใช้ SQLAlchemy models และ MySQL เพื่อจัดเก็บข้อมูลของระบบแบบถาวร
            การออกแบบนี้ช่วยให้โค้ดอ่านง่าย, บำรุงรักษาสะดวก และขยายขีดความสามารถได้ง่ายเนื่องจากมีการแยกหน้าที่กันอย่างชัดเจน (Separation of Concerns)

    5. การออกแบบเชิงวัตถุ (Object-Oriented Design)
        โครงการนี้ใช้หลักการ OOP ในการจำลองเอนทิตี (Entities) และพฤติกรรมของระบบออกมาเป็นคลาสต่าง ๆ
            ตัวอย่างคลาสที่สำคัญ:
                User: แทนข้อมูลบัญชีผู้ใช้และพฤติกรรมที่เกี่ยวข้องกับผู้ใช้
                Assignment: แทนข้อมูลงานที่มีชื่อ, กำหนดส่ง, ลำดับความสำคัญ, สถานะ, คะแนน และตรรกะการตรวจสอบความถูกต้อง (Validation)
                Course: แทนรายวิชาที่ใช้จัดกลุ่มงานต่าง ๆ
                WorkspaceSubject: แทนข้อมูล Metadata สำหรับ Workspace ในส่วน Frontend (เช่น สี และการจัดกลุ่มการแสดงผล)
                ReminderService: จัดการพฤติกรรมของการส่งอีเมลแจ้งเตือน
                AssignmentManager และ Analytics/Statistics Services: รับผิดชอบด้านการจัดการและวิเคราะห์ข้อมูลงานจำนวนมาก

    6. เส้นทางการไหลของข้อมูล (Data Flow)
        ขั้นตอนหลัก:
            ผู้ใช้สั่งงานผ่าน Frontend
            Frontend ส่ง HTTP Requests ไปยัง Backend API
            Backend ตรวจสอบความถูกต้องของข้อมูลด้วย Pydantic Schemas
            Backend ประมวลผลตรรกะทางธุรกิจผ่าน Service ต่าง ๆ
            SQLAlchemy อ่านหรือเขียนข้อมูลลงใน MySQL
            Backend ส่งข้อมูลกลับในรูปแบบ JSON
            Frontend อัปเดตหน้าจอตามข้อมูลที่ได้รับ
        สำหรับระบบแจ้งเตือนอัตโนมัติ:
            การตั้งค่าการแจ้งเตือนจะถูกบันทึกลงฐานข้อมูล
            ระบบ Background Scheduler ใน Backend จะตรวจสอบกำหนดส่งงานเป็นระยะ
            Scheduler ค้นหางานที่ใกล้ถึงกำหนดส่ง
            ReminderService ส่งอีเมลโดยอัตโนมัติ
            Notification logs จะถูกบันทึกเพื่อป้องกันการส่งซ้ำ

    7. การเชื่อมต่อกับบริการภายนอก (External Integration)
        ระบบมีการเชื่อมต่อกับบริการภายนอก 2 รูปแบบหลัก:
            SMTP Email: สำหรับการส่งอีเมลแจ้งเตือน
            Google Calendar API: สำหรับซิงค์งานไปยังปฏิทินส่วนตัว
            นอกจากนี้ยังมีการใช้ไลบรารี pandas ในการวิเคราะห์และสรุปผลข้อมูลงานตามลำดับความสำคัญและกำหนดส่ง

    8. ความคงทนและความน่าเชื่อถือ (Persistence and Reliability)
        ระบบจัดเก็บข้อมูลจริงใน MySQL และใช้ Docker Compose ในการรัน Backend และ Database ร่วมกัน การใช้ Docker Volume ช่วยให้ข้อมูลไม่สูญหายแม้จะมีการรีสตาร์ทเครื่อง
            ความน่าเชื่อถือของระบบได้รับการสนับสนุนจาก:
                การตรวจสอบข้อมูลขาเข้าด้วย Pydantic schemas
                การจัดการข้อผิดพลาดด้วย HTTPException ใน API routes
                Validation methods ภายใน Domain classes
                การจัดการ Error ในส่วนของระบบแจ้งเตือน และการเชื่อมต่อภายนอก

    9. ทำไมสถาปัตยกรรมนี้ถึงเหมาะสมกับโจทย์
        รองรับ UI ที่ตอบสนองได้รวดเร็ว (Responsive UI) สำหรับการจัดการงาน
        มีระบบจัดเก็บข้อมูลถาวรที่รองรับข้อมูลงานจำนวนมาก
        ตรรกะการแจ้งเตือนและการวิเคราะห์ถูกรวมไว้ที่ Backend เพื่อความปลอดภัยและความถูกต้อง
        การเชื่อมต่อภายนอกถูกแยกส่วนไว้ใน Service modules ทำให้จัดการได้ง่าย
        ระบบมีความยืดหยุ่น (Maintainability) รองรับการเพิ่มฟีเจอร์ในอนาคต

    10. สรุปภาพรวม (Summary)
        โดยสรุป โครงการนี้ใช้สถาปัตยกรรมแบบ Modular Client-Server ที่ประกอบด้วย Next.js (Frontend), FastAPI (Backend), และ SQLAlchemy + MySQL (Data Layer) 
        ร่วมกับการใช้งาน Docker Compose เพื่อความเสถียรในการรันระบบ การออกแบบนี้สะท้อนถึงโครงสร้างเชิงวัตถุที่ชัดเจน มีความคงทนของข้อมูล และสามารถขยายขีดความสามารถผ่านการเชื่อมต่อกับบริการภายนอกได้อย่างมีประสิทธิภาพ


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
    นายพนธกร เกษมสวัสดิ์ 6709616665        ทำหน้าที่พัฒนาทางฝั่งของ Backend และ Integrate Code 
    นางสาวสิริยากร พูนสินโภคทรัพย์ 6709616939 ทำหน้าที่พัฒนาและออกแบบหน้าเว็บฝั่ง frontend
    นายรัฐภูมิ แสงคำมา 6709616848           ทำหน้าที่พัฒนาทางฝั่งของ Backend และ Integrate Code 
    นายศุภณัฐ แก่นท้าว 6709616905           ทำหน้าที่พัฒนาทางฝั่งของ Backend และ Integrate Code 
    นางสาวโชติกา พัฒนาวิจิตร 6709681073     ทำหน้าที่พัฒนาและออกแบบหน้าเว็บฝั่ง frontend
    นายกนกพจน์ กาญจนประทุม 6709620022    ททำหน้าที่พัฒนาทางฝั่งของ Backend และสรุปวิเคราะห์การทำงานของระบบ
