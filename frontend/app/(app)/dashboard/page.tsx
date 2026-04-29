"use client";
import React, { useState, useEffect } from 'react';
import { Bell, Plus, Search, Clock } from 'lucide-react';
import Link from "next/link";
import Notification from '../../components/Notification';
import { assignmentAPI } from '../../services/api';

interface Assignment {
  id: number;
  title: string;
  description: string;
  deadline: string;
  course_id: number;
  user_id: number;
  status: string;
  score?: number;
}

export default function Dashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showNoti, setShowNoti] = useState(false);
  const [filters, setFilters] = useState({
    status: "all",
    sortBy: "default"
  });

  // Fetch assignments from backend
  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        setLoading(true);
        const data = await assignmentAPI.getAll();
        setAssignments(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Failed to fetch assignments:", err);
        setError("ไม่สามารถโหลดข้อมูลได้ กรุณาลองใหม่");
      } finally {
        setLoading(false);
      }
    };

    fetchAssignments();
  }, []);

  // Calculate stats
  const stats = [
    { label: "Total Assignments", value: assignments.length, color: "text-blue-500", dot: "bg-blue-500" },
    { label: "Completed", value: assignments.filter(a => a.status === "completed").length, color: "text-green-500", dot: "bg-green-500", large: true },
    { label: "Pending", value: assignments.filter(a => a.status === "pending").length, color: "text-orange-500", dot: "bg-orange-500", large: true },
    { label: "Overdue", value: assignments.filter(a => a.status === "overdue").length, color: "text-red-500", dot: "bg-red-500", large: true },
  ];

  // Process assignments based on filters and search
  const processedAssignments = assignments
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = filters.status === "all" || task.status === filters.status;
      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      if (filters.sortBy === "dueDateSoon") {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      return 0;
    });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('th-TH');
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="p-8 bg-[#EFEFEF] min-h-screen font-sans text-gray-800">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>

        <div className="relative">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowNoti(!showNoti)}
              className="p-2 bg-white rounded-lg shadow-sm border border-gray-200 relative hover:bg-gray-50"
            >
              <Bell className="w-5 h-5 text-gray-600" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>

            <Link href="/addtasks">
              <button className="flex items-center gap-2 bg-blue-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-600 transition">
                <Plus className="w-5 h-5" />
                Create Task
              </button>
            </Link>
          </div>

          <Notification isOpen={showNoti} onClose={() => setShowNoti(false)} />
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* Stats Section */}
        <div className="col-span-12 lg:col-span-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 h-full">
            <h2 className="text-xl font-bold mb-4">Summary</h2>
            <div className="space-y-3">
              {stats.filter(s => !s.large).map((stat, i) => (
                <div key={i} className="p-4 bg-gray-50 rounded-2xl flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                    <span className="text-xs text-gray-500">{stat.label}</span>
                  </div>
                  <span className="text-2xl font-bold">{stat.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="col-span-12 lg:col-span-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.filter(s => s.large).map((stat, i) => (
              <div key={i} className={`${stat.dot === "bg-green-500" ? "bg-green-50" : stat.dot === "bg-orange-500" ? "bg-orange-50" : "bg-red-50"} p-6 rounded-2xl flex flex-col justify-center items-center text-center`}>
                <div className="flex items-center gap-2 mb-2">
                  <div className={`w-2 h-2 rounded-full ${stat.dot}`} />
                  <span className={`text-xs ${stat.color}`}>{stat.label}</span>
                </div>
                <span className="text-[40px] font-bold">{stat.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Assignments Table */}
        <div className="col-span-12">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6 border-b border-gray-50 flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                <h2 className="text-xl font-bold">Assignments</h2>
                <div className="relative w-full md:w-64">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search tasks..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-50 border-none rounded-lg text-sm focus:ring-1 focus:ring-blue-200"
                  />
                </div>
              </div>

              {/* Filter Bar */}
              <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                <span>Filters:</span>
                <select
                  value={filters.status}
                  className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="all">Status (All)</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>

                <select
                  value={filters.sortBy}
                  className="bg-white border border-gray-200 rounded-full px-3 py-1 outline-none"
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                >
                  <option value="default">Sort By</option>
                  <option value="dueDateSoon">Due Date (Soon)</option>
                </select>
              </div>
            </div>

            {/* Table Content */}
            <div className="overflow-x-auto">
              {loading ? (
                <div className="p-6 text-center text-gray-500">
                  <p>กำลังโหลดข้อมูล...</p>
                </div>
              ) : error ? (
                <div className="p-6 text-center text-red-500">
                  <p>{error}</p>
                </div>
              ) : processedAssignments.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  <p>ไม่พบงาน</p>
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b border-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Title</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Description</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Deadline</th>
                      <th className="px-6 py-3 text-left font-semibold text-gray-700">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {processedAssignments.map((assignment) => {
                      const statusColors: { [key: string]: string } = {
                        pending: "bg-yellow-100 text-yellow-700",
                        completed: "bg-green-100 text-green-700",
                        overdue: "bg-red-100 text-red-700"
                      };
                      return (
                        <tr key={assignment.id} className="border-b border-gray-100 hover:bg-gray-50 transition">
                          <td className="px-6 py-4 font-medium text-gray-800">{assignment.title}</td>
                          <td className="px-6 py-4 text-gray-600">{assignment.description}</td>
                          <td className="px-6 py-4 text-gray-600">
                            <div className="flex items-center gap-2">
                              <Clock size={14} className="text-gray-400" />
                              <span>{formatDate(assignment.deadline)} {formatTime(assignment.deadline)}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[assignment.status] || "bg-gray-100 text-gray-700"}`}>
                              {assignment.status}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}