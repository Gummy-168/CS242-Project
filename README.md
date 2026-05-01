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
    mermaid_code = """classDiagram
    class User {
        +int id
        +string email
        +string username
        +string password_hash
        +string account_status
        +datetime created_at
        +datetime updated_at
        +bool login(email, password)
        +void logout()
        +string get_email()
        +void set_email(email)
        +string get_username()
        +void set_username(username)
        +int get_id()
        +bool authenticate_pw(password)
        +bool validate_account_status()
        +User register_user(id, email, username, password)
        +RegisterResponse register(payload)
        +LoginResponse login_api(payload)
    }

    class Course {
        +int course_id
        +int user_id
        +string course_name
        +string instructor_name
        +string semester
        +datetime created_at
        +datetime updated_at
        +string get_course_name()
        +void set_course_name(course_name)
        +bool validate_course_name()
        +void add_assignment(assignment)
        +void remove_assignment(assignment_id)
        +Assignment[] get_all_assignments()
    }

    class Assignment {
        +int assignment_id
        +int user_id
        +int course_id
        +string title
        +string description
        +datetime deadline
        +string priority
        +string status
        +string tag_color
        +float score
        +int difficulty
        +string calendar_event_id
        +datetime created_at
        +datetime updated_at
        +string course_name
        +string get_title()
        +void set_title(title)
        +string get_status()
        +void set_status(status)
        +void mark_complete()
        +bool is_overdue(current_time)
        +int days_remaining(current_time)
        +void update_priority(priority)
        +bool validate_deadline()
        +bool validate_status_transition(new_status)
        +Assignment create_assignment(payload)
        +Assignment[] get_assignments(user_id)
        +Assignment get_assignment_by_id(assignment_id)
        +Assignment update_assignment_status(id, status)
        +bool delete_assignment(assignment_id)
        +Assignment[] getAll(userId)
        +Assignment create(payload)
    }

    class Reminder {
        +int reminder_id
        +int assignment_id
        +int user_id
        +string reminder_type
        +int notify_before_days
        +boolean is_enabled
        +datetime last_sent_at
        +datetime created_at
        +datetime updated_at
        +Reminder from_env(reminder_type, notify_before_days)
        +bool validate_email_config()
        +datetime schedule_notification(assignment)
        +bool validate_reminder_settings()
        +bool send_email_notification(recipient_email, subject, body)
        +bool send_reminder(assignment, recipient_email)
        +map sync_to_calendar(assignments)
    }

    User "1" -- "*" Course : "creates"
    User "1" -- "*" Assignment : "owns"
    User "1" -- "*" Reminder : "configures"
    Course "1" -- "*" Assignment : "contains"
    Assignment "1" -- "*" Reminder : "triggers" """

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