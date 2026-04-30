"use client";
import { useState, useEffect } from "react";
import { formatInTimeZone } from "date-fns-tz";
import {
  ChevronLeft,
  ChevronDown,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link2,
  ExternalLink,
  Image as ImageIcon,
  Upload,
  Calendar as CalendarIcon,
  Star,
  Type,
  ChevronUp,
  Tag,
  Plus,
  X,
  FileText,
  FileImage,
  File,
  Trash2,
  Save,
} from "lucide-react";
import {
  useEditor,
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Image as TiptapImage } from "@tiptap/extension-image";
import TiptapUnderline from "@tiptap/extension-underline";
import { useRouter, useParams } from "next/navigation";
import { useSubjectContext } from "../../../components/SubjectContext";

// ─── Mock Data (แนะนำให้ย้ายไป lib/tasks.ts) ────────────────────────────────
const ALL_TASKS = [
  {
    id: 1,
    name: "Assignment2",
    type: "University Tasks",
    subject: "CS222",
    priority: 3,
    dueDate: "2026-04-27",
    time: "23:59",
    score: { current: "10", total: "100" },
    status: "normal",
    tags: ["exam"],
    details: "",
  },
  {
    id: 2,
    name: "งานกลุ่ม CS242",
    type: "University Tasks",
    subject: "CS232",
    priority: 3,
    dueDate: "2026-04-27",
    time: "23:59",
    score: { current: "30", total: "100" },
    status: "normal",
    tags: ["group"],
    details: "",
  },
  {
    id: 3,
    name: "การบ้าน 1",
    type: "University Tasks",
    subject: "CS242",
    priority: 2,
    dueDate: "2026-04-26",
    time: "23:59",
    score: { current: "10", total: "100" },
    status: "overdue",
    tags: [],
    details: "",
  },
  {
    id: 4,
    name: "Assignment2",
    type: "University Tasks",
    subject: "CS222",
    priority: 3,
    dueDate: "2026-04-27",
    time: "23:59",
    score: { current: "10", total: "100" },
    status: "normal",
    tags: [],
    details: "",
  },
  {
    id: 5,
    name: "งานกลุ่ม CS242",
    type: "University Tasks",
    subject: "CS232",
    priority: 3,
    dueDate: "2026-04-27",
    time: "23:59",
    score: { current: "30", total: "100" },
    status: "normal",
    tags: [],
    details: "",
  },
  {
    id: 6,
    name: "การบ้าน 1",
    type: "University Tasks",
    subject: "CS242",
    priority: 2,
    dueDate: "2026-04-26",
    time: "23:59",
    score: { current: "10", total: "100" },
    status: "overdue",
    tags: [],
    details: "",
  },
  {
    id: 101,
    name: "post ig",
    type: "Personal Tasks",
    subject: "",
    priority: 2,
    dueDate: "2026-04-30",
    time: "23:59",
    score: { current: "", total: "" },
    status: "normal",
    tags: ["comsci"],
    details: "",
  },
  {
    id: 102,
    name: "สรุปปลายภาค",
    type: "Personal Tasks",
    subject: "CS232",
    priority: 3,
    dueDate: "2026-04-30",
    time: "13:59",
    score: { current: "", total: "" },
    status: "done",
    tags: ["final"],
    details: "",
  },
  {
    id: 103,
    name: "ส่งงานโปรเจค",
    type: "Personal Tasks",
    subject: "",
    priority: 3,
    dueDate: "2026-04-29",
    time: "09:00",
    score: { current: "", total: "" },
    status: "overdue",
    tags: [],
    details: "",
  },
];

// ─── Resizable Image Extension ────────────────────────────────────────────────
const ResizableImageComponent = ({ node, updateAttributes }: any) => {
  const { src, width } = node.attrs;
  return (
    <NodeViewWrapper className="inline-block">
      <div className="relative inline-block group">
        <img
          src={src}
          style={{ width: width || "300px", display: "block" }}
          className="rounded-lg"
          draggable={false}
        />
        <div
          className="absolute bottom-0 right-0 w-4 h-4 bg-blue-500 rounded-tl-md cursor-se-resize opacity-0 group-hover:opacity-100 transition-opacity"
          onMouseDown={(e) => {
            e.preventDefault();
            const startX = e.clientX;
            const startW = parseInt(width || "300");
            const move = (e: MouseEvent) =>
              updateAttributes({
                width: `${Math.max(100, startW + e.clientX - startX)}px`,
              });
            const up = () => {
              window.removeEventListener("mousemove", move);
              window.removeEventListener("mouseup", up);
            };
            window.addEventListener("mousemove", move);
            window.addEventListener("mouseup", up);
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};

const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "300px",
        renderHTML: (a) => ({ style: `width: ${a.width}` }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

// ─── Main Component ───────────────────────────────────────────────────────────
export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const taskId = Number(params.id);
  const task = ALL_TASKS.find((t) => t.id === taskId);
  const { subjects } = useSubjectContext();

  const [, forceUpdate] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [notFound, setNotFound] = useState(false);

  // parse "HH:MM" → { h, m }
  const pt = (s: string) => {
    const [h, m] = (s || "23:59").split(":").map(Number);
    return { h: isNaN(h) ? 23 : h, m: isNaN(m) ? 59 : m };
  };
  const { h: initH, m: initM } = pt(task?.time ?? "23:59");

  // ── form state (pre-filled from task) ────────────────────────
  const [taskName, setTaskName] = useState(task?.name ?? "");
  const [taskType, setTaskType] = useState(task?.type ?? "University Tasks");
  const [selectedSubject, setSelectedSubject] = useState(task?.subject ?? "");
  const [priority, setPriority] = useState(task?.priority ?? 2);
  const [score, setScore] = useState(task?.score ?? { current: "", total: "" });
  const [details, setDetails] = useState(task?.details ?? "");
  const [dueDate, setDueDate] = useState(task?.dueDate ?? "");
  const [dueTime, setDueTime] = useState(task?.time ?? "23:59");
  const [hours, setHours] = useState(initH);
  const [minutes, setMinutes] = useState(initM);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"calendar" | "month" | "year">(
    "calendar",
  );
  const [currentViewDate, setCurrentViewDate] = useState(() =>
    task?.dueDate ? new Date(task.dueDate + "T00:00:00") : new Date(),
  );
  const [tags, setTags] = useState<string[]>(task?.tags ?? []);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [mediaModal, setMediaModal] = useState<"link" | "image" | null>(null);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [links, setLinks] = useState<{ text: string; url: string }[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);

  const timeZone = "Asia/Bangkok";
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  const years = Array.from({ length: 24 }, (_, i) => 2022 + i);

  // ── Editor ────────────────────────────────────────────────────
  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapUnderline,
      Link.configure({
        openOnClick: true,
        HTMLAttributes: { target: "_blank", rel: "noopener noreferrer" },
      }),
      ResizableImage.configure({ allowBase64: true }),
    ],
    content: task?.details ?? "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => setDetails(editor.getHTML()),
    onTransaction: () => forceUpdate((n) => n + 1),
  });

  useEffect(() => {
    if (!task) setNotFound(true);
  }, [task]);
  useEffect(() => {
    setDueTime(
      `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    );
  }, [hours, minutes]);

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("userId");
    
    if (!storedUserId) {
      router.push("/login");
    }
  }, []);

  const clampH = (n: number) => (n > 23 ? 0 : n < 0 ? 23 : n);
  const clampM = (n: number) => (n >= 60 ? 0 : n < 0 ? 59 : n);

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput("");
      setIsAddingTag(false);
    }
  };

  const insertLink = () => {
    if (!linkUrl.trim()) return;
    editor
      ?.chain()
      .focus()
      .extendMarkRange("link")
      .setLink({ href: linkUrl })
      .run();
    setLinks((p) => [...p, { text: linkText || linkUrl, url: linkUrl }]);
    setMediaModal(null);
  };

  const insertImage = (file: File) => {
    const r = new FileReader();
    r.onload = (e) =>
      editor
        ?.chain()
        .focus()
        .setImage({ src: e.target?.result as string } as any)
        .run();
    r.readAsDataURL(file);
    setMediaModal(null);
  };

  const daysInMonth = (mo: number, yr: number) =>
    new Date(yr, mo + 1, 0).getDate();
  const firstDayOfMonth = (mo: number, yr: number) =>
    new Date(yr, mo, 1).getDay();

  // ── Save ──────────────────────────────────────────────────────
  const handleSave = async () => {
    if (!taskName) return alert("Please enter task name");
    setIsSaving(true);
    const payload = {
      id: taskId,
      name: taskName,
      type: taskType,
      subject: selectedSubject,
      priority,
      dueDate,
      time: dueTime,
      score: score.current ? `${score.current}/${score.total}` : "",
      details,
      tags,
      status: task?.status ?? "normal",
    };
    console.log("Updating task...", payload); // TODO: real API call
    await new Promise((r) => setTimeout(r, 600));
    setIsSaving(false);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const getFileIcon = (f: File) =>
    f.type.startsWith("image/")
      ? FileImage
      : f.type === "application/pdf"
        ? FileText
        : File;
  const fmtSize = (b: number) =>
    b < 1024
      ? `${b} B`
      : b < 1024 * 1024
        ? `${(b / 1024).toFixed(1)} KB`
        : `${(b / (1024 * 1024)).toFixed(1)} MB`;

  const statusStyle: Record<string, string> = {
    normal: "bg-blue-50 text-blue-500 border-blue-100",
    overdue: "bg-red-50 text-red-500 border-red-100",
    done: "bg-green-50 text-green-500 border-green-100",
  };

  // ── Not found ─────────────────────────────────────────────────
  if (notFound)
    return (
      <main className="min-h-screen bg-[#EFEFEF] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-gray-400">Task not found</p>
          <button
            onClick={() => router.back()}
            className="px-6 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </main>
    );

  return (
    <main className="min-h-screen bg-[#EFEFEF] p-9">
      <div className="w-full pl-4 pr-8 grid grid-cols-12 gap-8">
        {/* ═══ LEFT ═══════════════════════════════════════════════ */}
        <div className="col-span-9 space-y-6">
          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
            {/* Back + Status badge */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.back()}
                className="flex items-center gap-1 text-gray-400 text-sm hover:text-black transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
              {task?.status && (
                <span
                  className={`text-[11px] font-bold uppercase px-3 py-1 rounded-full border ${statusStyle[task.status] ?? statusStyle.normal}`}
                >
                  {task.status}
                </span>
              )}
            </div>

            {/* Task Name */}
            <input
              type="text"
              placeholder="Task Name"
              className="text-4xl font-bold border-none outline-none placeholder:text-gray-200 mb-6 text-gray-800 w-full"
              value={taskName}
              onChange={(e) => setTaskName(e.target.value)}
            />

            {/* Editor */}
            <div className="border border-gray-200 rounded-xl flex flex-col flex-1">
              <div className="flex items-center gap-4 py-3 border-b border-gray-100 bg-gray-50 px-4 rounded-t-xl flex-wrap">
                {[
                  {
                    Icon: Bold,
                    mark: "bold",
                    fn: () => editor?.chain().focus().toggleBold().run(),
                  },
                  {
                    Icon: Italic,
                    mark: "italic",
                    fn: () => editor?.chain().focus().toggleItalic().run(),
                  },
                  {
                    Icon: Underline,
                    mark: "underline",
                    fn: () => editor?.chain().focus().toggleUnderline().run(),
                  },
                ].map(({ Icon, mark, fn }) => (
                  <Icon
                    key={mark}
                    onMouseDown={(e) => {
                      e.preventDefault();
                      fn();
                    }}
                    className={`cursor-pointer transition-all ${editor?.isActive(mark) ? "text-blue-500 scale-110" : "text-gray-600 hover:text-blue-500"}`}
                  />
                ))}
                <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleBulletList().run();
                  }}
                  className={`cursor-pointer ${editor?.isActive("bulletList") ? "text-blue-500" : "text-gray-600 hover:text-blue-500"}`}
                >
                  <List size={16} />
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleOrderedList().run();
                  }}
                  className={`cursor-pointer ${editor?.isActive("orderedList") ? "text-blue-500" : "text-gray-600 hover:text-blue-500"}`}
                >
                  <ListOrdered size={16} />
                </button>
                <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                <Link2
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const s = window.getSelection();
                    if (s?.rangeCount) setLinkText(s.toString());
                    setLinkUrl("");
                    setMediaModal("link");
                  }}
                  className="cursor-pointer text-gray-600 hover:text-blue-500"
                />
                <ImageIcon
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setMediaModal("image");
                  }}
                  className="cursor-pointer text-gray-600 hover:text-blue-500"
                />
              </div>
              <EditorContent editor={editor} className="p-4 min-h-[150px]" />
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
            <h3 className="font-bold mb-6 text-gray-800">Attachments</h3>
            <label
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                setFiles((p) => [...p, ...Array.from(e.dataTransfer.files)]);
              }}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40"}`}
            >
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files)
                    setFiles((p) => [...p, ...Array.from(e.target.files!)]);
                }}
              />
              <div className="p-3 bg-blue-500 rounded-xl">
                <Upload size={22} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">
                  {isDragging
                    ? "Drop files here"
                    : "Click to upload or drag & drop"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  SVG, PNG, JPG or PDF · max 10 MB
                </p>
              </div>
            </label>

            {files.length > 0 && (
              <div className="mt-5 space-y-2">
                {files.map((file, i) => {
                  const Icon = getFileIcon(file);
                  return (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      {file.type.startsWith("image/") ? (
                        <img
                          src={URL.createObjectURL(file)}
                          alt={file.name}
                          className="w-10 h-10 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                          <Icon size={18} className="text-blue-500" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {file.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {fmtSize(file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setFiles(files.filter((_, j) => j !== i))
                        }
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {links.length > 0 && (
              <div className="mt-5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
                  Links
                </p>
                <div className="space-y-2">
                  {links.map((link, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <ExternalLink size={16} className="text-indigo-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-700 truncate">
                          {link.text}
                        </p>
                        <p className="text-xs text-blue-400 truncate">
                          {link.url}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setLinks(links.filter((_, j) => j !== i))
                        }
                        className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400 transition-opacity"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT ══════════════════════════════════════════════ */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-6">
              PROPERTIES
            </h3>
            <div className="space-y-6">
              {/* Type toggle */}
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {(["Personal Tasks", "University Tasks"] as const).map(
                  (type) => (
                    <button
                      key={type}
                      onClick={() => setTaskType(type)}
                      className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${taskType === type ? "bg-white shadow-sm text-black" : "text-gray-400"}`}
                    >
                      <div
                        className={`h-2 w-2 rounded-full ml-3 relative top-[10px] ${type === "Personal Tasks" ? "bg-teal-500" : "bg-blue-400"}`}
                      />
                      <span className="ml-2 text-[13px] relative top-[-3px]">
                        {type}
                      </span>
                    </button>
                  ),
                )}
              </div>

              {/* Subject */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2">
                  <Type size={16} /> Subject
                </div>
                <select
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="">Choose Subject...</option>
                  {subjects.length > 0 ? (
                    subjects.map((subject) => (
                      <option key={subject.name} value={subject.name}>
                        {subject.name}
                      </option>
                    ))
                  ) : (
                    <option disabled value="">
                      No subjects available
                    </option>
                  )}
                </select>
              </div>

              {/* Due Date Picker */}
              <div className="flex items-center gap-4 relative">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2">
                  <CalendarIcon size={16} /> Due Date
                </div>
                <div
                  onClick={() => setIsPickerOpen(!isPickerOpen)}
                  className="flex-1 flex items-center justify-between border border-gray-200 rounded-lg px-3 py-2 text-sm cursor-pointer hover:bg-gray-50"
                >
                  <span className={dueDate ? "text-gray-700" : "text-gray-400"}>
                    {dueDate} {dueTime}
                  </span>
                  <ChevronDown size={14} />
                </div>

                {isPickerOpen && (
                  <div className="absolute top-12 left-0 z-50 bg-white border border-gray-100 shadow-2xl rounded-2xl p-6 w-[280px]">
                    <div className="flex items-center gap-2 mb-4 px-1">
                      <button
                        onClick={() =>
                          setViewMode(
                            viewMode === "month" ? "calendar" : "month",
                          )
                        }
                        className="flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded-lg"
                      >
                        <span className="font-bold text-sm text-gray-700">
                          {formatInTimeZone(currentViewDate, timeZone, "MMMM")}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`text-gray-400 transition-transform ${viewMode === "month" ? "rotate-180" : ""}`}
                        />
                      </button>
                      <button
                        onClick={() =>
                          setViewMode(viewMode === "year" ? "calendar" : "year")
                        }
                        className="flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded-lg"
                      >
                        <span className="font-bold text-sm text-gray-700">
                          {formatInTimeZone(currentViewDate, timeZone, "yyyy")}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`text-gray-400 transition-transform ${viewMode === "year" ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>

                    {viewMode === "calendar" && (
                      <div className="grid grid-cols-7 gap-1 text-center mb-4">
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map(
                          (d) => (
                            <div
                              key={d}
                              className="text-[10px] font-bold text-gray-300 py-2"
                            >
                              {d}
                            </div>
                          ),
                        )}
                        {Array.from({
                          length: firstDayOfMonth(
                            currentViewDate.getMonth(),
                            currentViewDate.getFullYear(),
                          ),
                        }).map((_, i) => (
                          <div key={`e${i}`} />
                        ))}
                        {Array.from({
                          length: daysInMonth(
                            currentViewDate.getMonth(),
                            currentViewDate.getFullYear(),
                          ),
                        }).map((_, i) => {
                          const day = i + 1;
                          const iso = `${currentViewDate.getFullYear()}-${(currentViewDate.getMonth() + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                          return (
                            <div
                              key={day}
                              onClick={() =>
                                setDueDate(
                                  formatInTimeZone(
                                    new Date(
                                      currentViewDate.getFullYear(),
                                      currentViewDate.getMonth(),
                                      day,
                                    ),
                                    timeZone,
                                    "yyyy-MM-dd",
                                  ),
                                )
                              }
                              className={`py-2 text-xs rounded-full cursor-pointer transition-all ${dueDate === iso ? "bg-blue-500 text-white font-bold" : "hover:bg-blue-50 text-gray-600"}`}
                            >
                              {day}
                            </div>
                          );
                        })}
                      </div>
                    )}
                    {viewMode === "month" && (
                      <div className="grid grid-cols-4 gap-2 py-2 mb-4">
                        {months.map((m, idx) => (
                          <button
                            key={m}
                            onClick={() => {
                              const d = new Date(currentViewDate);
                              d.setMonth(idx);
                              setCurrentViewDate(d);
                              setViewMode("calendar");
                            }}
                            className={`py-3 text-sm rounded-xl transition-all ${currentViewDate.getMonth() === idx ? "border border-blue-400 text-blue-500 font-bold" : "hover:bg-gray-50 text-gray-600"}`}
                          >
                            {m}
                          </button>
                        ))}
                      </div>
                    )}
                    {viewMode === "year" && (
                      <div className="grid grid-cols-4 gap-2 py-2 max-h-[220px] overflow-y-auto pr-1 mb-4">
                        {years.map((y) => (
                          <button
                            key={y}
                            onClick={() => {
                              const d = new Date(currentViewDate);
                              d.setFullYear(y);
                              setCurrentViewDate(d);
                              setViewMode("calendar");
                            }}
                            className={`py-3 text-sm rounded-xl transition-all ${currentViewDate.getFullYear() === y ? "border border-blue-400 text-blue-500 font-bold" : "hover:bg-gray-50 text-gray-600"}`}
                          >
                            {y}
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Time picker */}
                    <div className="flex justify-center items-center gap-4 mb-6">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => setHours(clampH(hours + 1))}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <ChevronUp size={20} />
                        </button>
                        <div className="bg-blue-50 text-blue-600 font-bold px-3 py-2 rounded-lg text-xl w-12 text-center">
                          {hours.toString().padStart(2, "0")}
                        </div>
                        <button
                          onClick={() => setHours(clampH(hours - 1))}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>
                      <div className="text-xl font-bold text-gray-300">:</div>
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => setMinutes(clampM(minutes + 1))}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <ChevronUp size={20} />
                        </button>
                        <div className="bg-blue-50 text-blue-600 font-bold px-3 py-2 rounded-lg text-xl w-12 text-center">
                          {minutes.toString().padStart(2, "0")}
                        </div>
                        <button
                          onClick={() => setMinutes(clampM(minutes - 1))}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>
                    </div>
                    <button
                      onClick={() => setIsPickerOpen(false)}
                      className="w-full bg-blue-500 text-white py-2 rounded-lg text-xs font-bold hover:bg-blue-600"
                    >
                      Confirm Time
                    </button>
                  </div>
                )}
              </div>

              {/* Priority */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2">
                  <Star size={16} /> Priority
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${
                        priority === p
                          ? p === 3
                            ? "bg-red-50 border-red-200 text-red-500"
                            : p === 2
                              ? "bg-orange-50 border-orange-200 text-orange-500"
                              : "bg-green-50 border-green-200 text-green-500"
                          : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-gray-300"
                      }`}
                    >
                      {p === 1 ? "★ Low" : p === 2 ? "★★ Med" : "★★★ High"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Score */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2">
                  <Star size={16} /> Score
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center text-gray-700 outline-none focus:border-blue-400 hover:bg-gray-50"
                    value={score.current}
                    onChange={(e) =>
                      setScore({ ...score, current: e.target.value })
                    }
                  />
                  <span className="text-gray-300">/</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center text-gray-700 outline-none focus:border-blue-400 hover:bg-gray-50"
                    value={score.total}
                    onChange={(e) =>
                      setScore({ ...score, total: e.target.value })
                    }
                  />
                </div>
              </div>

              {/* Tags */}
              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2">
                  <Tag size={16} /> Tags
                </div>
                <div className="flex flex-wrap items-center gap-2 max-w-[200px]">
                  {tags.map((tag, i) => (
                    <span
                      key={i}
                      className="px-3 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100 flex items-center gap-1 group"
                    >
                      {tag}
                      <button
                        onClick={() => setTags(tags.filter((_, j) => j !== i))}
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
                      className="text-xs border-b border-blue-400 outline-none w-20 py-1 text-gray-700"
                      value={tagInput}
                      onChange={(e) => setTagInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") addTag();
                        if (e.key === "Escape") setIsAddingTag(false);
                      }}
                      onBlur={() => {
                        if (!tagInput) setIsAddingTag(false);
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

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`w-full py-4 rounded-[18px] font-bold text-lg shadow-lg transition-all flex items-center justify-center gap-2
              ${saveSuccess ? "bg-green-500 text-white" : "bg-[#3D98EF] text-white hover:bg-blue-600"}
              ${isSaving ? "opacity-70 cursor-not-allowed" : ""}`}
          >
            {isSaving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />{" "}
                Saving...
              </>
            ) : saveSuccess ? (
              <>✓ Saved!</>
            ) : (
              <>
                <Save size={18} /> Save Changes
              </>
            )}
          </button>

          {/* Delete */}
          <button
            onClick={() => {
              if (confirm("Delete this task?")) {
                console.log("Deleting:", taskId);
                router.back();
              }
            }}
            className="w-full py-3 rounded-[18px] font-medium text-sm text-red-400 border border-red-100 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
          >
            <Trash2 size={16} /> Delete Task
          </button>
        </div>
      </div>

      {/* Link Modal */}
      {mediaModal === "link" && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">Insert Link</h3>
              <button
                onClick={() => setMediaModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={16} />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
                  Display Text
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-gray-500"
                  placeholder="e.g. Click here"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-500 uppercase tracking-widest mb-1.5 block">
                  URL
                </label>
                <input
                  className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-gray-500"
                  placeholder="https://..."
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                />
              </div>
              <button
                onClick={insertLink}
                className="w-full bg-blue-500 text-white py-2.5 rounded-xl text-sm font-bold hover:bg-blue-600"
              >
                Insert Link
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Modal */}
      {mediaModal === "image" && (
        <div className="fixed inset-0 bg-black/30 z-50 flex items-center justify-center">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-gray-800 text-lg">Insert Image</h3>
              <button
                onClick={() => setMediaModal(null)}
                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400"
              >
                <X size={16} />
              </button>
            </div>
            <label className="block cursor-pointer">
              <input
                type="file"
                accept="image/jpeg,image/png"
                className="hidden"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) insertImage(f);
                }}
              />
              <div className="border-2 border-dashed border-gray-200 rounded-2xl p-10 flex flex-col items-center gap-3 hover:border-blue-300 hover:bg-blue-50/40 transition-all">
                <div className="p-3 bg-blue-500 rounded-xl">
                  <Upload size={22} className="text-white" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-semibold text-gray-600">
                    Click to upload
                  </p>
                  <p className="text-xs text-gray-400 mt-1">JPG or PNG only</p>
                </div>
              </div>
            </label>
          </div>
        </div>
      )}
    </main>
  );
}
