"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Subject = {
  id?: number;
  name: string;
  color: string;
};

type SubjectContextType = {
  subjects: Subject[];
  setSubjects: React.Dispatch<React.SetStateAction<Subject[]>>;
  addSubject: (name: string) => Promise<void>;
  renameSubject: (index: number, name: string) => Promise<void>;
  changeColor: (index: number, color: string) => Promise<void>;
  deleteSubject: (index: number) => Promise<void>;
};

const storageKey = "workspace-subjects";
const SubjectContext = createContext<SubjectContextType | undefined>(undefined);

const defaultColors = [
  "#C589FF",
  "#91CCFF",
  "#A5FFBC",
  "#ffef42",
  "#FFCC91",
  "#FF8181",
  "#FF91D0",
  "#9CA3AF",
];

const DEFAULT_USER_ID = 1;

const getApiBaseUrl = () => {
  if (process.env.NEXT_PUBLIC_API_BASE_URL) {
    return process.env.NEXT_PUBLIC_API_BASE_URL;
  }
  if (typeof window !== "undefined") {
    return `${window.location.protocol}//${window.location.hostname}:8000`;
  }
  return "http://localhost:8000";
};

const getUserId = () => {
  if (typeof window === "undefined") return DEFAULT_USER_ID;
  const userId = window.localStorage.getItem("userId");
  return userId ? parseInt(userId, 10) : DEFAULT_USER_ID;
};

export function SubjectProvider({ children }: { children: React.ReactNode }) {
  const [subjects, setSubjects] = useState<Subject[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const loadSubjects = async () => {
      try {
        const res = await fetch(
          `${getApiBaseUrl()}/workspace_subjects?user_id=${getUserId()}`,
        );
        if (!res.ok) {
          throw new Error(`Failed to load subjects: ${res.status}`);
        }
        const data = await res.json();
        setSubjects(
          data.map((subject: any) => ({
            id: subject.id,
            name: subject.name,
            color: subject.color,
          })),
        );
      } catch (error) {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          try {
            setSubjects(JSON.parse(stored));
          } catch (parseError) {
            console.error("Failed to parse stored subjects", parseError);
          }
        }
        console.error(error);
      }
    };

    loadSubjects();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(storageKey, JSON.stringify(subjects));
  }, [subjects]);

  const addSubject = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    if (subjects.some((subject) => subject.name === trimmed)) return;

    const payload = {
      user_id: getUserId(),
      name: trimmed,
      color: defaultColors[subjects.length % defaultColors.length],
    };

    try {
      const res = await fetch(`${getApiBaseUrl()}/workspace_subjects`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        throw new Error(`Failed to create subject: ${res.status}`);
      }
      const subject = await res.json();
      setSubjects((prev) => [
        ...prev,
        {
          id: subject.id,
          name: subject.name,
          color: subject.color,
        },
      ]);
    } catch (error) {
      console.error(error);
      setSubjects((prev) => [
        ...prev,
        { name: trimmed, color: payload.color },
      ]);
    }
  };

  const renameSubject = async (index: number, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    let subjectId: number | undefined;
    setSubjects((prev) => {
      const next = [...prev];
      subjectId = next[index]?.id;
      if (next[index]) {
        next[index] = { ...next[index], name: trimmed };
      }
      return next;
    });

    if (subjectId == null) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/workspace_subjects/${subjectId}?user_id=${getUserId()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update subject name: ${res.status}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const changeColor = async (index: number, color: string) => {
    let subjectId: number | undefined;
    setSubjects((prev) => {
      const next = [...prev];
      subjectId = next[index]?.id;
      if (next[index]) {
        next[index] = { ...next[index], color };
      }
      return next;
    });

    if (subjectId == null) return;

    try {
      const res = await fetch(`${getApiBaseUrl()}/workspace_subjects/${subjectId}?user_id=${getUserId()}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ color }),
      });
      if (!res.ok) {
        throw new Error(`Failed to update subject color: ${res.status}`);
      }
    } catch (error) {
      console.error(error);
    }
  };

  const deleteSubject = async (index: number) => {
    const subjectId = subjects[index]?.id;
    if (subjectId == null) {
      throw new Error(
        "This subject cannot be deleted right now because it is not synced. Please refresh and try again.",
      );
    }

    const response = await fetch(
      `${getApiBaseUrl()}/workspace_subjects/${subjectId}?user_id=${getUserId()}`,
      {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
      },
    );

    if (!response.ok) {
      let detail = `Failed to delete subject: ${response.status}`;
      try {
        const errorData = await response.json();
        if (typeof errorData?.detail === "string") {
          detail = errorData.detail;
        }
      } catch {
        // keep default message
      }
      throw new Error(detail);
    }

    setSubjects((prev) => prev.filter((_, i) => i !== index));
  };

  const value = useMemo(
    () => ({
      subjects,
      setSubjects,
      addSubject,
      renameSubject,
      changeColor,
      deleteSubject,
    }),
    [subjects],
  );

  return <SubjectContext.Provider value={value}>{children}</SubjectContext.Provider>;
}

export function useSubjectContext() {
  const context = useContext(SubjectContext);
  if (!context) {
    throw new Error("useSubjectContext must be used within a SubjectProvider");
  }
  return context;
}
