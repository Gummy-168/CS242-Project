"use client";
import React from 'react';
import { X, Clock } from 'lucide-react'; 
const mockNotifications = [
  {
    id: 1,
    title: "งานกลุ่ม CS242",
    description: "is due tomorrow at 23:59",
    time: "just now",
    unread: true,
  },
  {
    id: 2,
    title: "Assignment2",
    description: "is due tomorrow at 23:59",
    time: "just now",
    unread: true,
  },
  {
    id: 3,
    title: "Assignment1",
    description: "is due tomorrow at 23:59",
    time: "1 Days Ago",
    unread: false,
  },
];
interface NotificationProps {
  isOpen: boolean;
  onClose: () => void;
}

const Notification = ({ isOpen, onClose }: NotificationProps) => {
  if (!isOpen) return null;

  return (
    <div className="absolute top-12 right-38 z-[9999] w-80 md:w-96 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-50">
        <h2 className="text-[16px] font-medium text-gray-800">Notification</h2>
        <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
          <X size={28} className="text-gray-600" />
        </button>
      </div>

      {/* Notification List */}
      <div className="max-h-[400px] overflow-y-auto">
        {mockNotifications.map((noti) => (
          <div 
            key={noti.id} 
            className="flex items-start gap-4 p-4 border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            {/* Status Indicator Dot */}
            <div className={`mt-2 w-3 h-3 rounded-full flex-shrink-0 ${noti.unread ? 'bg-red-500' : 'bg-gray-300'}`} />
            
            <div className="flex-1">
              <div className="text-[12px] text-gray-800">
                <span className="font-semibold">{noti.title}</span> 
                <span className="text-gray-400 ml-1">{noti.description}</span>
              </div>
              
              <div className="flex items-center gap-1 mt-1 text-gray-300 italic text-sm">
                <Clock size={14} />
                <span>{noti.time}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Footer / Extra Space */}
      <div className="h-12 bg-white" />
    </div>
  );
};

export default Notification;