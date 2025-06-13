import { useNavigate } from 'react-router-dom';
import { Clock, MapPin } from 'lucide-react';
import { useState, useEffect } from 'react';
import useCategoryStyle from '../hooks/useCategoryStyle';

const MissionCard = ({ mission, compact = false }) => {
  const navigate = useNavigate();
  const { categoryStyle, categoryIcon } = useCategoryStyle(mission.category);
  
  const getDurationBadgeColor = (duration) => {
    if (duration <= 15) {
      return 'bg-vs-orange-light text-vs-orange-dark';
    } else if (duration <= 30) {
      return 'bg-vs-blue-light text-vs-blue-dark';
    } else {
      return 'bg-vs-green-light text-vs-green-dark';
    }
  };
  
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('fr-FR', { 
      day: 'numeric', 
      month: 'long'
    }).format(date);
  };
  
  const formatTime = (timeString) => {
    // Format: "HH:MM:SS" to "HH:MM"
    return timeString.substring(0, 5);
  };
  
  const handleClick = () => {
    navigate(`/mission/${mission.id}`);
  };
  
  return (
    <div 
      className={`bg-white rounded-xl p-4 shadow-sm mb-3 border-l-4 ${categoryStyle} mission-card cursor-pointer`}
      onClick={handleClick}    >
      <div className="flex justify-between items-start mb-2">
        <div className="flex items-center">
          {categoryIcon && (
            <span className="mr-2" role="img" aria-label={mission.category}>
              {categoryIcon}
            </span>
          )}
          <h3 className="font-medium text-vs-gray-800">{mission.title}</h3>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full font-medium ${getDurationBadgeColor(mission.duration)}`}>
          {mission.duration} min
        </span>
      </div>
      
      {!compact && (
        <p className="text-sm text-vs-gray-600 mb-3">{mission.short_description}</p>
      )}
      
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            <Clock size={14} className="text-vs-gray-500 mr-1" />
            <span className="text-xs text-vs-gray-500">
              {formatDate(mission.date)} • {formatTime(mission.start_time)}
            </span>
          </div>
          
          <div className="flex items-center">
            <MapPin size={14} className="text-vs-gray-500 mr-1" />
            <span className="text-xs text-vs-gray-500">{mission.city}</span>
          </div>
        </div>
          {mission.association && (
          <div className="flex items-center">
            <div 
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/association/${mission.association_id}`);
              }}
              className="cursor-pointer"
            >
              {mission.association.logo_url ? (
                <img 
                  src={mission.association.logo_url} 
                  alt={mission.association.name} 
                  className="h-6 w-6 rounded-full mr-1"
                />
              ) : (
                <div className="h-6 w-6 rounded-full bg-vs-blue-light flex items-center justify-center text-vs-blue-dark text-xs font-medium mr-1">
                  {mission.association.name.charAt(0)}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MissionCard;
