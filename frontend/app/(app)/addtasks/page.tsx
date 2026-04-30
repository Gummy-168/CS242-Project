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
import { useRouter, useSearchParams } from "next/navigation";
import { useSubjectContext } from "../../components/SubjectContext";
import { assignmentAPI, type AssignmentCreatePayload } from "@/api";

// ── Resizable Image Component ──────────────────────────────────
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
            const startWidth = parseInt(width || "300");
            const onMouseMove = (e: MouseEvent) => {
              const newWidth = Math.max(100, startWidth + (e.clientX - startX));
              updateAttributes({ width: `${newWidth}px` });
            };
            const onMouseUp = () => {
              window.removeEventListener("mousemove", onMouseMove);
              window.removeEventListener("mouseup", onMouseUp);
            };
            window.addEventListener("mousemove", onMouseMove);
            window.addEventListener("mouseup", onMouseUp);
          }}
        />
      </div>
    </NodeViewWrapper>
  );
};

// ── Resizable Image Extension ──────────────────────────────────
const ResizableImage = TiptapImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: "300px",
        renderHTML: (attrs) => ({ style: `width: ${attrs.width}` }),
      },
    };
  },
  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});

export default function CreateTaskPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { subjects } = useSubjectContext();
  const [, forceUpdate] = useState(0);

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
    content: "",
    immediatelyRender: false,
    onUpdate: ({ editor }) => setDetails(editor.getHTML()),
    onTransaction: () => forceUpdate((n) => n + 1),
  });

  const timeZone = "Asia/Bangkok";
  const now = new Date();

  const [taskName, setTaskName] = useState("");
  useEffect(() => {
    const currentName = searchParams.get("name");
    if (currentName) {
      setTaskName(currentName);
    }
  }, [searchParams]);

  const [taskType, setTaskType] = useState("University Tasks");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [priority, setPriority] = useState(2);
  const [score, setScore] = useState({ current: "", total: "" });
  const [details, setDetails] = useState("");
  const [dueDate, setDueDate] = useState<string>(
    formatInTimeZone(now, timeZone, "yyyy-MM-dd"),
  );
  const [dueTime, setDueTime] = useState<string>("23:59");
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [hours, setHours] = useState(
    parseInt(formatInTimeZone(now, timeZone, "HH")),
  );
  const [minutes, setMinutes] = useState(
    parseInt(formatInTimeZone(now, timeZone, "mm")),
  );
  const [viewMode, setViewMode] = useState<"calendar" | "month" | "year">(
    "calendar",
  );
  const [currentViewDate, setCurrentViewDate] = useState(new Date());
  const [tags, setTags] = useState<string[]>([]);
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [mediaModal, setMediaModal] = useState<"link" | "image" | null>(null);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");
  const [links, setLinks] = useState<{ text: string; url: string }[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  useEffect(() => {
    const formattedTime = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
    setDueTime(formattedTime);
  }, [hours, minutes]);

  useEffect(() => {
    const storedUserId = window.localStorage.getItem("userId");
    if (!storedUserId) {
      router.push("/login");
      return;
    }

    const parsedUserId = Number.parseInt(storedUserId, 10);
    if (!Number.isNaN(parsedUserId)) {
      setUserId(parsedUserId);
    }
  }, []);

  const addTag = () => {
    if (tagInput.trim() !== "" && !tags.includes(tagInput.trim())) {
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
    setLinks((prev) => [...prev, { text: linkText || linkUrl, url: linkUrl }]);
    setMediaModal(null);
  };

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const src = e.target?.result as string;
      editor
        ?.chain()
        .focus()
        .setImage({ src } as any)
        .run();
    };
    reader.readAsDataURL(file);
    setMediaModal(null);
  };

  const daysInMonth = (month: number, year: number) =>
    new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = (month: number, year: number) =>
    new Date(year, month, 1).getDay();

  const handleHours = (delta: number) =>
    setHours((prev) => {
      let n = prev + delta;
      if (n > 23) return 0;
      if (n < 0) return 23;
      return n;
    });
  const handleMinutes = (delta: number) =>
    setMinutes((prev) => {
      let n = prev + delta;
      if (n >= 60) return 0;
      if (n < 0) return 59;
      return n;
    });

  const handleCreateTask = async () => {
    if (!taskName.trim()) {
      alert("Please enter task name");
      return;
    }

    if (!userId) {
      alert("Please login again before creating a task.");
      router.push("/login");
      return;
    }
    const currentUserId = userId;
    const deadline = new Date(`${dueDate}T${dueTime}:00`);
    const courseName =
      selectedSubject.trim() || (taskType === "Personal Tasks" ? "Personal" : "");

    if (!courseName) {
      alert("Please choose subject");
      return;
    }

    const scoreValue =
      score.current.trim() === "" ? null : Number.parseFloat(score.current);
    const normalizedScore =
      scoreValue === null || Number.isNaN(scoreValue) ? null : scoreValue;
    const difficultyValue = Math.min(Math.max(tags.length || 1, 1), 5);

    const payload: AssignmentCreatePayload = {
      title: taskName.trim(),
      description: details.trim() || "No description",
      deadline: deadline.toISOString(),
      priority:
        priority === 3 ? "HIGH" : priority === 2 ? "MEDIUM" : "LOW",
      status: "PENDING",
      tag_color: "#3D98EF",
      user_id: currentUserId,
      course_id: null,
      course_name: courseName,
      score: normalizedScore,
      difficulty: difficultyValue,
    };

    try {
      setIsSubmitting(true);
      await assignmentAPI.create(payload);
      console.log("Success");
      alert("Task Created Successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Failed to create task:", error);
      alert(
        error instanceof Error
          ? `Failed to create task: ${error.message}`
          : "Failed to create task. Please try again.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith("image/")) return FileImage;
    if (file.type === "application/pdf") return FileText;
    return File;
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <main className="min-h-screen bg-[#EFEFEF] p-9">
      <div className="w-full pl-4 pr-8 grid grid-cols-12 gap-8">
        <div className="col-span-9 space-y-6">
          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
            <button
              onClick={() => router.back()}
              className="flex items-center gap-1 text-gray-400 text-sm mb-4 hover:text-black"
            >
              <ChevronLeft size={16} /> Back
            </button>
            <input
              type="text"
              placeholder="Task Name"
              className="text-4xl font-bold border-none outline-none placeholder:text-gray-200 mb-6 text-gray-800"
              value={taskName}
              onChange={(e) => {
                setTaskName(e.target.value);
                // Update URL โดยไม่ navigate
                const params = new URLSearchParams(window.location.search);
                params.set("name", e.target.value);
                window.history.replaceState(null, "", `?${params.toString()}`);
              }}
            />
            <div className="border border-gray-200 rounded-xl flex flex-col flex-1">
              {/* Toolbar */}
              <div className="flex items-center gap-4 py-3 border-b border-gray-100 bg-gray-50 px-4 rounded-t-xl">
                <Bold
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleBold().run();
                  }}
                  className={`cursor-pointer transition-all duration-150 ${editor?.isActive("bold") ? "text-blue-500 scale-110" : "text-gray-600 hover:text-blue-500"}`}
                />
                <Italic
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleItalic().run();
                  }}
                  className={`cursor-pointer transition-all duration-150 ${editor?.isActive("italic") ? "text-blue-500 scale-110" : "text-gray-600 hover:text-blue-500"}`}
                />
                <Underline
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleUnderline().run();
                  }}
                  className={`cursor-pointer transition-all duration-150 ${editor?.isActive("underline") ? "text-blue-500 scale-110" : "text-gray-600 hover:text-blue-500"}`}
                />
                <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleBulletList().run();
                  }}
                  className={`cursor-pointer transition-all duration-150 ${editor?.isActive("bulletList") ? "text-blue-500 scale-110" : "text-gray-600 hover:text-blue-500"}`}
                >
                  <List size={16} />
                </button>
                <button
                  onMouseDown={(e) => {
                    e.preventDefault();
                    editor?.chain().focus().toggleOrderedList().run();
                  }}
                  className={`cursor-pointer transition-all duration-150 ${editor?.isActive("orderedList") ? "text-blue-500 scale-110" : "text-gray-600 hover:text-blue-500"}`}
                >
                  <ListOrdered size={16} />
                </button>
                <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                <Link2
                  onMouseDown={(e) => {
                    e.preventDefault();
                    const sel = window.getSelection();
                    if (sel && sel.rangeCount > 0) setLinkText(sel.toString());
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
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${isDragging ? "border-blue-400 bg-blue-50 scale-[1.01]" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40"}`}
            >
              <input
                type="file"
                multiple
                className="hidden"
                onChange={handleFileUpload}
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
                {files.map((file, index) => {
                  const Icon = getFileIcon(file);
                  const isImage = file.type.startsWith("image/");
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:bg-gray-100 transition-colors group"
                    >
                      {isImage ? (
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
                          {formatSize(file.size)}
                        </p>
                      </div>
                      <button
                        onClick={() =>
                          setFiles(files.filter((_, i) => i !== index))
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400"
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
                  {links.map((link, index) => (
                    <div
                      key={index}
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
                          setLinks(links.filter((_, i) => i !== index))
                        }
                        className="opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded-lg hover:bg-red-50 hover:text-red-500 text-gray-400"
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

        {/* RIGHT SIDE */}
        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-6">
              PROPERTIES
            </h3>
            <div className="space-y-6">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                <button
                  onClick={() => setTaskType("Personal Tasks")}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${taskType === "Personal Tasks" ? "bg-white shadow-sm text-black" : "text-gray-400"}`}
                >
                  <div className="h-2 w-2 bg-teal-500 rounded-full ml-3 relative top-[10px]" />
                  <span className="ml-2 text-[14px] relative top-[-3px]">
                    Personal Tasks
                  </span>
                </button>
                <button
                  onClick={() => setTaskType("University Tasks")}
                  className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${taskType === "University Tasks" ? "bg-white shadow-sm text-black" : "text-gray-400"}`}
                >
                  <div className="h-2 w-2 bg-blue-400 rounded-full ml-3 relative top-[10px]" />
                  <span className="ml-2 text-[14px] relative top-[-3px]">
                    University Tasks
                  </span>
                </button>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2">
                  <Type size={16} /> Subject
                </div>
                <select
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none font-medium text-gray-700 transition-colors hover:bg-gray-50 hover:border-gray-300"
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
                        className="flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
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
                        className="flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded-lg transition-colors"
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
                          <div key={`e-${i}`} />
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
                        {months.map((m, index) => (
                          <button
                            key={m}
                            onClick={() => {
                              const d = new Date(currentViewDate);
                              d.setMonth(index);
                              setCurrentViewDate(d);
                              setViewMode("calendar");
                            }}
                            className={`py-3 text-sm rounded-xl transition-all ${currentViewDate.getMonth() === index ? "border border-blue-400 text-blue-500 font-bold" : "hover:bg-gray-50 text-gray-600"}`}
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
                    <div className="flex justify-center items-center gap-4 mb-6">
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleHours(1)}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <ChevronUp size={20} />
                        </button>
                        <div className="bg-blue-50 text-blue-600 font-bold px-3 py-2 rounded-lg text-xl w-12 text-center">
                          {hours.toString().padStart(2, "0")}
                        </div>
                        <button
                          onClick={() => handleHours(-1)}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <ChevronDown size={20} />
                        </button>
                      </div>
                      <div className="text-xl font-bold text-gray-300">:</div>
                      <div className="flex flex-col items-center">
                        <button
                          onClick={() => handleMinutes(1)}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <ChevronUp size={20} />
                        </button>
                        <div className="bg-blue-50 text-blue-600 font-bold px-3 py-2 rounded-lg text-xl w-12 text-center">
                          {minutes.toString().padStart(2, "0")}
                        </div>
                        <button
                          onClick={() => handleMinutes(-1)}
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

              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2">
                  <Star size={16} /> Priority
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3].map((p) => (
                    <button
                      key={p}
                      onClick={() => setPriority(p)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${priority === p ? (p === 3 ? "bg-red-50 border-red-200 text-red-500" : p === 2 ? "bg-orange-50 border-orange-200 text-orange-500" : "bg-green-50 border-green-200 text-green-500") : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-gray-300"}`}
                    >
                      {p === 1 ? "★ Low" : p === 2 ? "★★ Med" : "★★★ High"}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2">
                  <Star size={16} /> Score
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center text-gray-700 outline-none focus:border-blue-400 transition-colors hover:bg-gray-50"
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
                    className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center text-gray-700 outline-none focus:border-blue-400 transition-colors hover:bg-gray-50"
                    value={score.total}
                    onChange={(e) =>
                      setScore({ ...score, total: e.target.value })
                    }
                  />
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2">
                  <Tag size={16} /> Tags
                </div>
                <div className="flex flex-wrap items-center gap-2 max-w-[200px]">
                  {tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-3 py-1 bg-gray-50 text-gray-600 text-xs rounded-full border border-gray-100 flex items-center gap-1 group"
                    >
                      {tag}
                      <button
                        onClick={() =>
                          setTags(tags.filter((_, i) => i !== index))
                        }
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

          <button
            onClick={handleCreateTask}
            disabled={isSubmitting}
            className="w-full bg-[#3D98EF] text-white py-4 rounded-[18px] font-bold text-lg shadow-lg hover:bg-blue-600 transition-all mt-10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            {isSubmitting ? "Creating..." : "Create Task"}
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
                  const file = e.target.files?.[0];
                  if (file) insertImage(file);
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
