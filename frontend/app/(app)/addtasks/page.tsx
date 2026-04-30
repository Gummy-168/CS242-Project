"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { formatInTimeZone } from 'date-fns-tz';
import { assignmentAPI, getStoredUserId } from '../../services/api';
import { 
  ChevronLeft, 
  ChevronDown,
  Bold, 
  Italic, 
  Underline, 
  List, 
  ListOrdered, 
  Link2, 
  Image as ImageIcon,
  Upload,
  Calendar as CalendarIcon,
  Star,
  Clock,
  Type,
  ChevronUp,
  ChevronRight,
  Tag,
  Plus
} from "lucide-react";

// Subject to Course ID mapping
const SUBJECT_TO_COURSE: { [key: string]: number } = {
  "CS222": 1,
  "CS232": 2,
  "CS242": 3,
};

const PRIORITY_TO_ENUM = {
  1: "LOW",
  2: "MEDIUM",
  3: "HIGH",
} as const;

export default function CreateTaskPage() {
  const router = useRouter();
  const timeZone = 'Asia/Bangkok';
  const now = new Date();
  
  
  const [taskName, setTaskName] = useState("");
  const [taskType, setTaskType] = useState("University Tasks"); 
  const [selectedSubject, setSelectedSubject] = useState("");
  const [priority, setPriority] = useState(2); 
  const [score, setScore] = useState({ current: "", total: "" });
  const [details, setDetails] = useState("");
  const [dueDate, setDueDate] = useState<string>(formatInTimeZone(now, timeZone, 'yyyy-MM-dd')); 
  const [dueTime, setDueTime] = useState<string>("23:59"); 
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  const [hours, setHours] = useState(parseInt(formatInTimeZone(now, timeZone, 'HH')));
  const [minutes, setMinutes] = useState(parseInt(formatInTimeZone(now, timeZone, 'mm')));
  const [viewMode, setViewMode] = useState<"calendar" | "month" | "year">("calendar");
  const [currentViewDate, setCurrentViewDate] = useState(new Date()); 

  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const years = Array.from({ length: 24 }, (_, i) => 2022 + i);

  const [tags, setTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<number | null>(null);

  // Get user ID from localStorage
  useEffect(() => {
    setUserId(getStoredUserId());
  }, []);

  const addTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
      setIsAddingTag(false);
    }
  };  
  
  useEffect(() => {
    const formattedTime = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    setDueTime(formattedTime);
  }, [hours, minutes]);

  const daysInMonth = (month: number, year: number) => new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) => new Date(year, month, 1).getDay();
  
  const handleDateSelect = (day: number) => {
    const selected = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day);
    setDueDate(formatInTimeZone(selected, timeZone, 'yyyy-MM-dd'));
  };

  const handleHours = (delta: number) => {
    setHours(prev => {
      let next = prev + delta;
      if (next > 23) return 0; 
      if (next < 0) return 23; 
      return next;
    });
  };

  const handleMinutes = (delta: number) => {
    setMinutes(prev => {
      let next = prev + delta;
      if (next >= 60) return 0;
      if (next < 0) return 59;
      return next;
    });
  };

  const handleCreateTask = async () => {
    if (!taskName) {
      setError("กรุณาระบุชื่องาน");
      return;
    }
    if (!selectedSubject) {
      setError("กรุณาเลือกวิชา");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const effectiveUserId = userId ?? getStoredUserId();
      const courseId = SUBJECT_TO_COURSE[selectedSubject];
      const deadline = `${dueDate}T${dueTime}:00`;
      const parsedScore = score.current.trim() ? Number(score.current) : undefined;

      if (parsedScore !== undefined && Number.isNaN(parsedScore)) {
        setLoading(false);
        setError("คะแนนต้องเป็นตัวเลข");
        return;
      }

      await assignmentAPI.create({
        user_id: effectiveUserId,
        course_id: courseId,
        course_name: selectedSubject,
        title: taskName,
        description: details || "ไม่มีรายละเอียด",
        deadline: deadline,
        priority: PRIORITY_TO_ENUM[priority as keyof typeof PRIORITY_TO_ENUM],
        status: "PENDING",
        score: parsedScore,
      });

      setLoading(false);
      alert("สร้างงานสำเร็จแล้ว!");
      router.push("/dashboard");
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "สร้างงานล้มเหลว กรุณาลองใหม่");
    }
  };

  return (
    <main className="min-h-screen bg-[#EFEFEF] p-9">
    <div className="flex  items-center mb-8 bg-white px-8 py-6 shadow-md border-b border-gray-100 -mt-9 -mx-9">        
        <span>Tasks</span>
        <span className="text-gray-300 mr-2 ml-2">{'   >   '}</span>
        <span className="text-gray-600 font-medium">   Task Name   </span>
      </div>

      <div className="w-full pl-4 pr-8 grid grid-cols-12 gap-8">
        {/* LEFT SIDE */}
        <div className="col-span-9 space-y-6">
          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
            <button onClick={() => router.back()} className="flex items-center gap-1 text-gray-400 text-sm mb-4 hover:text-black">
              <ChevronLeft size={16} /> Back
            </button>

            <input 
              type="text" placeholder="Task Name"
              className="text-4xl font-bold border-none outline-none placeholder:text-gray-200 mb-6"
              value={taskName} onChange={(e) => setTaskName(e.target.value)}
            />

            <div className="flex items-center gap-4 py-3 border-y border-gray-100 mb-4">
              <Bold size={18} className="text-gray-400 cursor-pointer" />
              <Italic size={18} className="text-gray-400 cursor-pointer" />
              <Underline size={18} className="text-gray-400 cursor-pointer" />
              <div className="w-[1px] h-4 bg-gray-200 mx-1" />
              <List size={18} className="text-gray-400 cursor-pointer" />
              <ListOrdered size={18} className="text-gray-400 cursor-pointer" />
              <div className="w-[1px] h-4 bg-gray-200 mx-1" />
              <Link2 size={18} className="text-gray-400 cursor-pointer" />
              <ImageIcon size={18} className="text-gray-400 cursor-pointer" />
            </div>

            <textarea 
              placeholder="Add more details to this task..."
              className="flex-1 w-full resize-none border-none outline-none text-gray-600 placeholder:text-gray-300 text-lg"
              value={details} onChange={(e) => setDetails(e.target.value)}
            />
          </div>

          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
            <h3 className="font-bold mb-4">Attachments</h3>
            <div className="border-2 border-dashed border-gray-100 rounded-xl p-10 flex flex-col items-center justify-center gap-3 bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer">
              <div className="bg-blue-500 p-2 rounded-lg text-white"><Upload size={20} /></div>
              <p className="text-sm font-medium">Click to upload or drag and drop</p>
              <p className="text-xs text-gray-400">SVG, PNG, JPG or PDF (max. 10MB)</p>
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-6">PROPERTIES</h3>
            
            <div className="space-y-6">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button onClick={() => setTaskType("Personal Tasks")} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${taskType === "Personal Tasks" ? "bg-white shadow-sm text-black" : "text-gray-400"}`}>
                  <div className="h-2 w-2 bg-[#FFA600] rounded-full ml-3 relative top-[10px]"></div>
                  <span className="ml-2 text-[14px] relative top-[-3px]">Personal Tasks</span> 
                </button>
                <button onClick={() => setTaskType("University Tasks")} className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${taskType === "University Tasks" ? "bg-white shadow-sm text-black" : "text-gray-400"}`}>
                  <div className="h-2 w-2 bg-[#FF3DF2] rounded-full ml-3 relative top-[10px]"></div>
                  <span className="ml-2 text-[14px] relative top-[-3px]">University Tasks</span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2"><Type size={16} /> Subject</div>
                <select className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none" value={selectedSubject} onChange={(e) => setSelectedSubject(e.target.value)}>
                  <option value="">Choose Subject...</option>
                  <option value="CS222">CS222</option>
                  <option value="CS232">CS232</option>
                  <option value="CS242">CS242</option>
                </select>
              </div>

              {/* Due Date Section */}
              <div className="flex items-center gap-4 relative">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2"><CalendarIcon size={16} /> Due Date</div>
                <div onClick={() => setIsPickerOpen(!isPickerOpen)} className="flex-1 flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
                  <span className={dueDate ? "text-black" : "text-gray-400"}>{dueDate} {dueTime}</span>
                  <ChevronDown size={14} />
                </div>

                {isPickerOpen && (
                  <div className="absolute top-12 left-0 z-50 bg-white border border-gray-100 shadow-2xl rounded-2xl p-6 w-[280px]">
                    
                   {/* duedate Header  */}
                  <div className="flex items-center gap-2 mb-4 px-1">
                    {/* Month dropdown */}
                    <button 
                        onClick={() => setViewMode(viewMode === "month" ? "calendar" : "month")}
                        className="flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
                    >
                        <span className="font-bold text-sm text-gray-700">
                        {formatInTimeZone(currentViewDate, timeZone, 'MMMM')}
                        </span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${viewMode === 'month' ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Year dropdown */}
                    <button 
                        onClick={() => setViewMode(viewMode === "year" ? "calendar" : "year")}
                        className="flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
                    >
                        <span className="font-bold text-sm text-gray-700">
                        {formatInTimeZone(currentViewDate, timeZone, 'yyyy')}
                        </span>
                        <ChevronDown size={14} className={`text-gray-400 transition-transform ${viewMode === 'year' ? 'rotate-180' : ''}`} />
                    </button>
                    </div>
                    {/*  Main Calendar  */}
                    {viewMode === "calendar" && (
                        <div className="grid grid-cols-7 gap-1 text-center">
                        {['SUN','MON','TUE','WED','THU','FRI','SAT'].map(d => (
                            <div key={d} className="text-[10px] font-bold text-gray-300 py-2">{d}</div>
                        ))}
                        {/* วันที่  */}
                        {Array.from({ length: firstDayOfMonth(currentViewDate.getMonth(), currentViewDate.getFullYear()) }).map((_, i) => <div key={`empty-${i}`} />)}
                        {Array.from({ length: daysInMonth(currentViewDate.getMonth(), currentViewDate.getFullYear()) }).map((_, i) => {
                            const day = i + 1;
                            const isSelected = dueDate === `${currentViewDate.getFullYear()}-${(currentViewDate.getMonth()+1).toString().padStart(2,'0')}-${day.toString().padStart(2,'0')}`;
                            return (
                            <div 
                                key={day} 
                                onClick={() => {
                                const selected = new Date(currentViewDate.getFullYear(), currentViewDate.getMonth(), day);
                                setDueDate(formatInTimeZone(selected, timeZone, 'yyyy-MM-dd'));
                                }}
                                className={`py-2 text-xs rounded-full cursor-pointer transition-all ${isSelected ? 'bg-blue-500 text-white font-bold' : 'hover:bg-blue-50 text-gray-600'}`}
                            >
                                {day}
                            </div>
                            );
                        })}
                        </div>
                    )}
                    {/*  Month Pick  */}
                    {viewMode === "month" && (
                        <div className="grid grid-cols-4 gap-2 py-2">
                        {months.map((m, index) => (
                            <button
                            key={m}
                            onClick={() => {
                                const nextDate = new Date(currentViewDate);
                                nextDate.setMonth(index);
                                setCurrentViewDate(nextDate);
                                setViewMode("calendar");
                            }}
                            className={`py-3 text-sm rounded-xl transition-all ${currentViewDate.getMonth() === index ? 'border border-blue-400 text-blue-500 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                            >
                            {m}
                            </button>
                        ))}
                        </div>
                    )}

                    {/* Year Pick */}
                    {viewMode === "year" && (
                        <div className="grid grid-cols-4 gap-2 py-2 max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                        {years.map((y) => (
                            <button
                            key={y}
                            onClick={() => {
                                const nextDate = new Date(currentViewDate);
                                nextDate.setFullYear(y);
                                setCurrentViewDate(nextDate);
                                setViewMode("calendar");
                            }}
                            className={`py-3 text-sm rounded-xl transition-all ${currentViewDate.getFullYear() === y ? 'border border-blue-400 text-blue-500 font-bold' : 'hover:bg-gray-50 text-gray-600'}`}
                            >
                            {y}
                            </button>
                        ))}
                        </div>
                    )}

                    <div className="flex justify-center items-center gap-4 mb-6">
                      <div className="flex flex-col items-center">
                        <button onClick={() => handleHours(1)} className="text-gray-400 hover:text-blue-500"><ChevronUp size={20} /></button>
                        <div className="bg-blue-50 text-blue-600 font-bold px-3 py-2 rounded-lg text-xl w-12 text-center">{hours.toString().padStart(2, '0')}</div>
                        <button onClick={() => handleHours(-1)} className="text-gray-400 hover:text-blue-500"><ChevronDown size={20} /></button>
                      </div>
                      <div className="text-xl font-bold text-gray-300">:</div>
                      <div className="flex flex-col items-center">
                        <button onClick={() => handleMinutes(1)} className="text-gray-400 hover:text-blue-500"><ChevronUp size={20} /></button>
                        <div className="bg-blue-50 text-blue-600 font-bold px-3 py-2 rounded-lg text-xl w-12 text-center">{minutes.toString().padStart(2, '0')}</div>
                        <button onClick={() => handleMinutes(-1)} className="text-gray-400 hover:text-blue-500"><ChevronDown size={20} /></button>
                      </div>
                    </div>
                    <button onClick={() => setIsPickerOpen(false)} className="w-full bg-blue-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-600">Confirm Time</button>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2"><Star size={16} /> Priority</div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((p) => (
                    <button key={p} onClick={() => setPriority(p)} className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${priority === p ? (p === 3 ? 'bg-red-50 border-red-200 text-red-500' : p === 2 ? 'bg-orange-50 border-orange-200 text-orange-500' : 'bg-green-50 border-green-200 text-green-500') : 'bg-white border-gray-100 text-gray-300'}`}>
                      {p === 1 ? '★ Low' : p === 2 ? '★★ Medium' : '★★★ High'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2"><Star size={16} /> Score</div>
                <div className="flex items-center gap-2">
                  <input type="text" placeholder="0" className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" value={score.current} onChange={(e) => setScore({...score, current: e.target.value})} />
                  <span className="text-gray-300">/</span>
                  <input type="text" placeholder="100" className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center" value={score.total} onChange={(e) => setScore({...score, total: e.target.value})} />
                </div>
              </div>

              {/* tags */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2"><Tag size={16} /> Tags</div>
                <div className="flex items-center gap-2">
                  <div className="flex flex-wrap items-center gap-2 max-w-[200px]">
 
                    {tags.map((tag, index) => (
                      <span 
                        key={index} 
                        className="px-3 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100 flex items-center gap-1 group"
                      >
                              {tag}
                              <button 
                                onClick={() => setTags(tags.filter((_, i) => i !== index))}
                                className="hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                              >
                                ×
                              </button>
                            </span>
                          ))}

                   
                      {isAddingTag ? (
                        <input
                          autoFocus
                          type="text"
                          className="text-xs border-b border-blue-400 outline-none w-20 py-1"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') addTag();
                            if (e.key === 'Escape') setIsAddingTag(false);
                          }}
                          onBlur={() => {
                            if (tagInput === "") setIsAddingTag(false);
                            else addTag();
                          }}
                        />
                      ) : (
                        
                        <button 
                          onClick={() => setIsAddingTag(true)}
                          className="px-3 py-1 border-2 border-dashed border-gray-200 rounded-full text-gray-400 text-xs hover:border-blue-300 hover:text-blue-400 transition-all flex items-center gap-1"
                        >
                          <Plus size={12} /> Add Tag
                        </button>
                      )}
                    </div>
                </div>
              </div>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {error}
            </div>
          )}

          <button 
            onClick={handleCreateTask} 
            disabled={loading}
            className="w-full bg-[#3D98EF] hover:bg-blue-600 disabled:bg-gray-400 text-white py-4 rounded-[18px] font-bold text-lg shadow-lg transition-all mt-10"
          >
            {loading ? "กำลังสร้างงาน..." : "Create Task"}
          </button>
        </div>
      </div>
    </main>
  );
}
