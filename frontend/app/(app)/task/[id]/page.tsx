"use client";

import { useEffect, useState } from "react";
import { formatInTimeZone } from "date-fns-tz";
import {
  Bold,
  Calendar as CalendarIcon,
  ChevronDown,
  ChevronLeft,
  ChevronUp,
  ExternalLink,
  File,
  FileImage,
  FileText,
  Image as ImageIcon,
  Italic,
  Link2,
  List,
  ListOrdered,
  Save,
  Star,
  Tag,
  Trash2,
  Type,
  Underline,
  Upload,
  X,
} from "lucide-react";
import {
  EditorContent,
  NodeViewWrapper,
  ReactNodeViewRenderer,
  useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import { Image as TiptapImage } from "@tiptap/extension-image";
import TiptapUnderline from "@tiptap/extension-underline";
import { useParams, useRouter, useSearchParams } from "next/navigation";

import {
  assignmentAPI,
  type Assignment,
  type AssignmentUpdatePayload,
} from "@/api";
import {
  APP_TIME_ZONE,
  parseApiDate,
  toUtcISOStringFromAppDateTime,
} from "@/lib/datetime";
import { useSubjectContext } from "../../../components/SubjectContext";

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
          onMouseDown={(event) => {
            event.preventDefault();
            const startX = event.clientX;
            const startWidth = Number.parseInt(width || "300", 10);
            const onMouseMove = (moveEvent: MouseEvent) => {
              const newWidth = Math.max(
                100,
                startWidth + (moveEvent.clientX - startX),
              );
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

const PRIORITY_MAP: Record<Assignment["priority"], number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
};

const STATUS_MAP: Record<Assignment["status"], string> = {
  PENDING: "normal",
  IN_PROGRESS: "normal",
  COMPLETED: "done",
  OVERDUE: "overdue",
};

export default function EditTaskPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const { subjects } = useSubjectContext();
  const taskId = Number(params.id);
  const fromPage = searchParams.get("from") ?? "dashboard";
  const [, forceUpdate] = useState(0);

  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [userId, setUserId] = useState<number | null>(null);
  const [originalAssignment, setOriginalAssignment] = useState<Assignment | null>(
    null,
  );

  const [taskName, setTaskName] = useState("");
  const [taskType, setTaskType] = useState("University Tasks");
  const [selectedSubject, setSelectedSubject] = useState("");
  const [priority, setPriority] = useState(2);
  const [score, setScore] = useState({ current: "", total: "" });
  const [details, setDetails] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [dueTime, setDueTime] = useState("23:59");
  const [hours, setHours] = useState(23);
  const [minutes, setMinutes] = useState(59);
  const [isPickerOpen, setIsPickerOpen] = useState(false);
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
    onTransaction: () => forceUpdate((count) => count + 1),
  });

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
  const years = Array.from({ length: 24 }, (_, index) => 2022 + index);

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
  }, [router]);

  useEffect(() => {
    if (!taskId || Number.isNaN(taskId)) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchAssignment = async () => {
      try {
        setLoading(true);
        setError("");
        const assignment = await assignmentAPI.getById(taskId);
        setOriginalAssignment(assignment);

        const taskCourseName = assignment.course_name || "";
        const isPersonalTask = taskCourseName === "Personal";
        const assignmentDate = parseApiDate(assignment.deadline);
        const assignmentHours = Number.parseInt(
          formatInTimeZone(assignmentDate, APP_TIME_ZONE, "HH"),
          10,
        );
        const assignmentMinutes = Number.parseInt(
          formatInTimeZone(assignmentDate, APP_TIME_ZONE, "mm"),
          10,
        );

        setTaskName(assignment.title);
        setTaskType(isPersonalTask ? "Personal Tasks" : "University Tasks");
        setSelectedSubject(isPersonalTask ? "" : taskCourseName);
        setPriority(PRIORITY_MAP[assignment.priority] ?? 2);
        setScore({
          current:
            typeof assignment.score === "number" ? String(assignment.score) : "",
          total:
            typeof assignment.score_total === "number"
              ? String(assignment.score_total)
              : typeof assignment.score === "number"
                ? "100"
                : "",
        });
        setDetails(assignment.description || "");
        setDueDate(formatInTimeZone(assignmentDate, APP_TIME_ZONE, "yyyy-MM-dd"));
        setHours(assignmentHours);
        setMinutes(assignmentMinutes);
        setDueTime(
          `${assignmentHours.toString().padStart(2, "0")}:${assignmentMinutes
            .toString()
            .padStart(2, "0")}`,
        );
        setCurrentViewDate(assignmentDate);
        setTags([]);
        setLinks([]);
        setFiles([]);
        editor?.commands.setContent(assignment.description || "");
      } catch (fetchError) {
        console.error("Failed to load assignment:", fetchError);
        setError("Failed to load assignment.");
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchAssignment();
  }, [editor, taskId]);

  useEffect(() => {
    setDueTime(
      `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`,
    );
  }, [hours, minutes]);

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
    setLinks((prev) => [...prev, { text: linkText || linkUrl, url: linkUrl }]);
    setMediaModal(null);
  };

  const insertImage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      editor?.chain().focus().setImage({ src } as any).run();
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
      const next = prev + delta;
      if (next > 23) return 0;
      if (next < 0) return 23;
      return next;
    });

  const handleMinutes = (delta: number) =>
    setMinutes((prev) => {
      const next = prev + delta;
      if (next >= 60) return 0;
      if (next < 0) return 59;
      return next;
    });

  const handleSave = async () => {
    if (!taskName.trim()) {
      alert("Please enter task name");
      return;
    }

    const currentUserId = userId ?? originalAssignment?.user_id;
    if (!currentUserId) {
      alert("User not found");
      return;
    }

    const courseName =
      taskType === "Personal Tasks" ? "Personal" : selectedSubject.trim();

    if (!courseName) {
      alert("Please choose subject");
      return;
    }

    const scoreValue =
      score.current.trim() === "" ? null : Number.parseFloat(score.current);
    const normalizedScore =
      scoreValue === null || Number.isNaN(scoreValue) ? null : scoreValue;
    const scoreTotalValue =
      score.total.trim() === "" ? null : Number.parseFloat(score.total);
    const normalizedScoreTotal =
      scoreTotalValue === null || Number.isNaN(scoreTotalValue)
        ? null
        : scoreTotalValue;

    const payload: AssignmentUpdatePayload = {
      title: taskName.trim(),
      description: details.trim() || "No description",
      deadline: toUtcISOStringFromAppDateTime(dueDate, dueTime),
      priority: priority === 3 ? "HIGH" : priority === 2 ? "MEDIUM" : "LOW",
      status: originalAssignment?.status ?? "PENDING",
      tag_color: originalAssignment?.tag_color ?? "#3D98EF",
      user_id: currentUserId,
      course_id: null,
      course_name: courseName,
      score: normalizedScore,
      score_total: normalizedScoreTotal,
      difficulty: Math.min(Math.max(tags.length || 1, 1), 5),
    };

    try {
      setIsSaving(true);
      setError("");
      await assignmentAPI.updateAssignment(taskId, payload);
      setSaveSuccess(true);
      setTimeout(() => {
        router.push(fromPage === "tasks" ? "/tasks" : "/dashboard");
      }, 500);
    } catch (saveError) {
      console.error("Failed to update assignment:", saveError);
      setError("Failed to update assignment.");
    } finally {
      setIsSaving(false);
    }
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

  const statusStyle: Record<string, string> = {
    normal: "bg-blue-50 text-blue-500 border-blue-100",
    overdue: "bg-red-50 text-red-500 border-red-100",
    done: "bg-green-50 text-green-500 border-green-100",
  };

  const displayStatus = STATUS_MAP[originalAssignment?.status ?? "PENDING"];

  if (loading) {
    return (
      <main className="min-h-screen bg-[#EFEFEF] flex items-center justify-center">
        <p className="text-gray-500">Loading task...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-[#EFEFEF] flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-2xl font-bold text-gray-400">Task not found</p>
          <button
            onClick={() => router.push(fromPage === "tasks" ? "/tasks" : "/dashboard")}
            className="px-6 py-2 bg-blue-500 text-white rounded-xl text-sm font-medium hover:bg-blue-600"
          >
            Go Back
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#EFEFEF] p-9">
      <div className="w-full pl-4 pr-8 grid grid-cols-12 gap-8">
        <div className="col-span-9 space-y-6">
          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => router.push(fromPage === "tasks" ? "/tasks" : "/dashboard")}
                className="flex items-center gap-1 text-gray-400 text-sm hover:text-black transition-colors"
              >
                <ChevronLeft size={16} /> Back
              </button>
              <span
                className={`text-[11px] font-bold uppercase px-3 py-1 rounded-full border ${statusStyle[displayStatus] ?? statusStyle.normal}`}
              >
                {displayStatus}
              </span>
            </div>

            {error && (
              <p className="mb-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-500">
                {error}
              </p>
            )}

            {saveSuccess && (
              <p className="mb-4 rounded-xl bg-green-50 px-4 py-3 text-sm text-green-600">
                Task updated successfully.
              </p>
            )}

            <input
              type="text"
              placeholder="Task Name"
              className="text-4xl font-bold border-none outline-none placeholder:text-gray-200 mb-6 text-gray-800 w-full"
              value={taskName}
              onChange={(event) => setTaskName(event.target.value)}
            />

            <div className="border border-gray-200 rounded-xl flex flex-col flex-1">
              <div className="flex items-center gap-4 py-3 border-b border-gray-100 bg-gray-50 px-4 rounded-t-xl flex-wrap">
                {[Bold, Italic, Underline].map((Icon, index) => {
                  const actions = [
                    () => editor?.chain().focus().toggleBold().run(),
                    () => editor?.chain().focus().toggleItalic().run(),
                    () => editor?.chain().focus().toggleUnderline().run(),
                  ];
                  const marks = ["bold", "italic", "underline"];
                  return (
                    <Icon
                      key={marks[index]}
                      onMouseDown={(event) => {
                        event.preventDefault();
                        actions[index]();
                      }}
                      className={`cursor-pointer transition-all ${editor?.isActive(marks[index]) ? "text-blue-500 scale-110" : "text-gray-600 hover:text-blue-500"}`}
                    />
                  );
                })}
                <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                <button
                  onMouseDown={(event) => {
                    event.preventDefault();
                    editor?.chain().focus().toggleBulletList().run();
                  }}
                  className={`cursor-pointer ${editor?.isActive("bulletList") ? "text-blue-500" : "text-gray-600 hover:text-blue-500"}`}
                >
                  <List size={16} />
                </button>
                <button
                  onMouseDown={(event) => {
                    event.preventDefault();
                    editor?.chain().focus().toggleOrderedList().run();
                  }}
                  className={`cursor-pointer ${editor?.isActive("orderedList") ? "text-blue-500" : "text-gray-600 hover:text-blue-500"}`}
                >
                  <ListOrdered size={16} />
                </button>
                <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                <Link2
                  onMouseDown={(event) => {
                    event.preventDefault();
                    const selection = window.getSelection();
                    if (selection?.rangeCount) setLinkText(selection.toString());
                    setLinkUrl("");
                    setMediaModal("link");
                  }}
                  className="cursor-pointer text-gray-600 hover:text-blue-500"
                />
                <ImageIcon
                  onMouseDown={(event) => {
                    event.preventDefault();
                    setMediaModal("image");
                  }}
                  className="cursor-pointer text-gray-600 hover:text-blue-500"
                />
              </div>
              <EditorContent editor={editor} className="p-4 min-h-[150px]" />
            </div>
          </div>

          <div className="bg-white rounded-[24px] p-8 shadow-sm border border-gray-100">
            <h3 className="font-bold mb-6 text-gray-800">Attachments</h3>
            <label
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(event) => {
                event.preventDefault();
                setIsDragging(false);
                setFiles((prev) => [...prev, ...Array.from(event.dataTransfer.files)]);
              }}
              className={`border-2 border-dashed rounded-2xl p-10 flex flex-col items-center justify-center gap-3 cursor-pointer transition-all duration-200 ${isDragging ? "border-blue-400 bg-blue-50" : "border-gray-200 bg-gray-50 hover:border-blue-300 hover:bg-blue-50/40"}`}
            >
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files) {
                    setFiles((prev) => [...prev, ...Array.from(event.target.files)]);
                  }
                }}
              />
              <div className="p-3 bg-blue-500 rounded-xl">
                <Upload size={22} className="text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-gray-600">
                  {isDragging ? "Drop files here" : "Click to upload or drag & drop"}
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
                  return (
                    <div
                      key={index}
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
                        <p className="text-xs text-gray-400">{formatSize(file.size)}</p>
                      </div>
                      <button
                        onClick={() => setFiles(files.filter((_, itemIndex) => itemIndex !== index))}
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
                        <p className="text-xs text-blue-400 truncate">{link.url}</p>
                      </div>
                      <button
                        onClick={() => setLinks(links.filter((_, itemIndex) => itemIndex !== index))}
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

        <div className="col-span-3 space-y-6">
          <div className="bg-white rounded-[24px] p-6 shadow-sm border border-gray-100">
            <h3 className="text-[14px] font-bold text-gray-400 uppercase tracking-widest mb-6">
              PROPERTIES
            </h3>
            <div className="space-y-6">
              <div className="flex bg-gray-100 p-1 rounded-xl">
                {(["Personal Tasks", "University Tasks"] as const).map((type) => (
                  <button
                    key={type}
                    onClick={() => setTaskType(type)}
                    className={`flex-1 py-2 rounded-lg text-xs font-medium transition-all ${taskType === type ? "bg-white shadow-sm text-black" : "text-gray-400"}`}
                  >
                    <div
                      className={`h-2 w-2 rounded-full ml-3 relative top-[10px] ${type === "Personal Tasks" ? "bg-teal-500" : "bg-blue-400"}`}
                    />
                    <span className="ml-2 text-[13px] relative top-[-3px]">{type}</span>
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-4">
                <div className="w-24 text-[14px] text-gray-500 flex items-center gap-2">
                  <Type size={16} /> Subject
                </div>
                <select
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm outline-none font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  value={selectedSubject}
                  onChange={(event) => setSelectedSubject(event.target.value)}
                  disabled={taskType === "Personal Tasks"}
                >
                  <option value="">
                    {taskType === "Personal Tasks"
                      ? "Personal"
                      : "Choose Subject..."}
                  </option>
                  {subjects.map((subject) => (
                    <option key={subject.name} value={subject.name}>
                      {subject.name}
                    </option>
                  ))}
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
                          setViewMode(viewMode === "month" ? "calendar" : "month")
                        }
                        className="flex items-center gap-1 hover:bg-gray-50 px-2 py-1 rounded-lg"
                      >
                        <span className="font-bold text-sm text-gray-700">
                          {formatInTimeZone(currentViewDate, APP_TIME_ZONE, "MMMM")}
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
                          {formatInTimeZone(currentViewDate, APP_TIME_ZONE, "yyyy")}
                        </span>
                        <ChevronDown
                          size={14}
                          className={`text-gray-400 transition-transform ${viewMode === "year" ? "rotate-180" : ""}`}
                        />
                      </button>
                    </div>

                    {viewMode === "calendar" && (
                      <div className="grid grid-cols-7 gap-1 text-center mb-4">
                        {["SUN", "MON", "TUE", "WED", "THU", "FRI", "SAT"].map((day) => (
                          <div
                            key={day}
                            className="text-[10px] font-bold text-gray-300 py-2"
                          >
                            {day}
                          </div>
                        ))}
                        {Array.from({
                          length: firstDayOfMonth(
                            currentViewDate.getMonth(),
                            currentViewDate.getFullYear(),
                          ),
                        }).map((_, index) => (
                          <div key={`empty-${index}`} />
                        ))}
                        {Array.from({
                          length: daysInMonth(
                            currentViewDate.getMonth(),
                            currentViewDate.getFullYear(),
                          ),
                        }).map((_, index) => {
                          const day = index + 1;
                          const iso = `${currentViewDate.getFullYear()}-${(
                            currentViewDate.getMonth() + 1
                          )
                            .toString()
                            .padStart(2, "0")}-${day.toString().padStart(2, "0")}`;
                          return (
                            <div
                              key={day}
                              onClick={() => setDueDate(iso)}
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
                        {months.map((month, index) => (
                          <button
                            key={month}
                            onClick={() => {
                              const nextDate = new Date(currentViewDate);
                              nextDate.setMonth(index);
                              setCurrentViewDate(nextDate);
                              setViewMode("calendar");
                            }}
                            className={`py-3 text-sm rounded-xl transition-all ${currentViewDate.getMonth() === index ? "border border-blue-400 text-blue-500 font-bold" : "hover:bg-gray-50 text-gray-600"}`}
                          >
                            {month}
                          </button>
                        ))}
                      </div>
                    )}

                    {viewMode === "year" && (
                      <div className="grid grid-cols-4 gap-2 py-2 max-h-[220px] overflow-y-auto pr-1 mb-4">
                        {years.map((year) => (
                          <button
                            key={year}
                            onClick={() => {
                              const nextDate = new Date(currentViewDate);
                              nextDate.setFullYear(year);
                              setCurrentViewDate(nextDate);
                              setViewMode("calendar");
                            }}
                            className={`py-3 text-sm rounded-xl transition-all ${currentViewDate.getFullYear() === year ? "border border-blue-400 text-blue-500 font-bold" : "hover:bg-gray-50 text-gray-600"}`}
                          >
                            {year}
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
                  {[1, 2, 3].map((priorityValue) => (
                    <button
                      key={priorityValue}
                      onClick={() => setPriority(priorityValue)}
                      className={`px-3 py-1.5 rounded-lg text-[10px] font-bold border transition-all ${priority === priorityValue ? priorityValue === 3 ? "bg-red-50 border-red-200 text-red-500" : priorityValue === 2 ? "bg-orange-50 border-orange-200 text-orange-500" : "bg-green-50 border-green-200 text-green-500" : "bg-white border-gray-100 text-gray-400 hover:bg-gray-50 hover:border-gray-300"}`}
                    >
                      {priorityValue === 1
                        ? "★ Low"
                        : priorityValue === 2
                          ? "★★ Med"
                          : "★★★ High"}
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
                    onChange={(event) =>
                      setScore({ ...score, current: event.target.value })
                    }
                  />
                  <span className="text-gray-300">/</span>
                  <input
                    type="number"
                    min="0"
                    placeholder="100"
                    className="w-12 border border-gray-200 rounded-lg px-2 py-1 text-sm text-center text-gray-700 outline-none focus:border-blue-400 transition-colors hover:bg-gray-50"
                    value={score.total}
                    onChange={(event) =>
                      setScore({ ...score, total: event.target.value })
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
                        onClick={() => setTags(tags.filter((_, itemIndex) => itemIndex !== index))}
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
                      onChange={(event) => setTagInput(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") addTag();
                        if (event.key === "Escape") setIsAddingTag(false);
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
                      <Tag size={12} /> Add Tag
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className="w-full bg-[#3D98EF] text-white py-4 rounded-[18px] font-bold text-lg shadow-lg hover:bg-blue-600 transition-all mt-10 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <span className="flex items-center justify-center gap-2">
              <Save size={18} />
              {isSaving ? "Saving..." : "Save"}
            </span>
          </button>
        </div>
      </div>

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
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-gray-500"
                placeholder="Display text"
                value={linkText}
                onChange={(event) => setLinkText(event.target.value)}
              />
              <input
                className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-blue-400 text-gray-500"
                placeholder="https://..."
                value={linkUrl}
                onChange={(event) => setLinkUrl(event.target.value)}
              />
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
            <input
              type="file"
              accept="image/*"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) insertImage(file);
              }}
              className="w-full text-sm text-gray-500"
            />
          </div>
        </div>
      )}
    </main>
  );
}
