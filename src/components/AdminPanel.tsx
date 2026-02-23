import React, { useState, useCallback } from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Racer, Track } from '../gameTypes';
import { API_URL, headers } from '../services/apiClient';
import { theme } from '../theme';

interface AdminPanelProps {
  roster: Racer[];
  tracks: Track[];
  onStartTestRace: (racers: Racer[], track: Track) => void;
  onResetSeason: () => void;
  onKillRace: () => void;
  onBack: () => void;
}

const DEBUG_SHOW_TEST_RACE = process.env.NODE_ENV === 'development';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  roster,
  tracks,
  onStartTestRace,
  onResetSeason,
  onKillRace,
  onBack,
}) => {
  const [selectedTrack, setSelectedTrack] = useState<Track>(tracks[0]);
  const [selectedRacerIds, setSelectedRacerIds] = useState<string[]>([]);
  const [killRaceId, setKillRaceId] = useState('');

  const toggleRacer = (racerId: string) => {
    setSelectedRacerIds(prev => 
      prev.includes(racerId) 
        ? prev.filter(id => id !== racerId)
        : [...prev, racerId]
    );
  };

  const handleStartTestRace = () => {
    if (selectedRacerIds.length === 0 || !selectedTrack) return;
    const racers = roster.filter(r => selectedRacerIds.includes(r.id));
    onStartTestRace(racers, selectedTrack);
  };

  const handleForceKillRace = async () => {
    if (!killRaceId.trim()) return;
    try {
      await fetch(`${API_URL}/race-manager?raceId=${killRaceId.trim()}`, {
        method: 'DELETE',
        headers,
      });
      console.log('🛑 Force kill successful');
      setKillRaceId('');
    } catch (err) {
      console.error('Failed to force kill race:', err);
    }
  };

  if (!DEBUG_SHOW_TEST_RACE) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
        <Text style={{ color: theme.text.primary, fontSize: 18 }}>Admin panel not available in production</Text>
        <TouchableOpacity onPress={onBack} style={{ marginTop: 20 }}>
          <Text style={{ color: '#3b82f6', fontSize: 16 }}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <Text style={{ color: theme.text.primary, fontSize: 24, fontWeight: 'bold' }}>🔧 Admin Panel</Text>
        <TouchableOpacity onPress={onBack}>
          <Text style={{ color: '#3b82f6', fontSize: 16 }}>← Back</Text>
        </TouchableOpacity>
      </View>

      {/* Reset All Data */}
      <View style={{ marginBottom: 24 }}>
        <TouchableOpacity
          onPress={onResetSeason}
          style={{ padding: 16, backgroundColor: '#9333ea', borderRadius: 8 }}
        >
          <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>🔄 Reset All Data</Text>
        </TouchableOpacity>
        <Text style={{ color: theme.text.muted, fontSize: 12, marginTop: 4 }}>
          Clears all season history, standings, and regenerates schedule
        </Text>
      </View>

      {/* Kill Race by ID */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: theme.text.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>🛑 Kill Race by ID</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <TextInput
            value={killRaceId}
            onChangeText={setKillRaceId}
            placeholder="Race ID (e.g., s1-race-0-1234567890)"
            placeholderTextColor="#666"
            style={{ 
              flex: 1, 
              backgroundColor: '#1a1a1a', 
              color: '#fff', 
              paddingHorizontal: 12, 
              paddingVertical: 10, 
              borderRadius: 8,
              fontSize: 14,
            }}
          />
          <TouchableOpacity
            onPress={handleForceKillRace}
            style={{ paddingHorizontal: 16, paddingVertical: 10, backgroundColor: '#dc2626', borderRadius: 8 }}
          >
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Kill</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Start Test Race */}
      <View style={{ marginBottom: 24 }}>
        <Text style={{ color: theme.text.primary, fontSize: 16, fontWeight: 'bold', marginBottom: 8 }}>🧪 Start Test Race</Text>
        
        <Text style={{ color: theme.text.secondary, fontSize: 14, marginBottom: 8 }}>Select Track:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {tracks.map(track => (
            <TouchableOpacity
              key={track.id}
              onPress={() => setSelectedTrack(track)}
              style={{ 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                backgroundColor: selectedTrack?.id === track.id ? '#3b82f6' : '#2a2a2a', 
                borderRadius: 6 
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12 }}>{track.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={{ color: theme.text.secondary, fontSize: 14, marginBottom: 8 }}>Select Racers:</Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          {roster.map(racer => (
            <TouchableOpacity
              key={racer.id}
              onPress={() => toggleRacer(racer.id)}
              style={{ 
                paddingHorizontal: 12, 
                paddingVertical: 8, 
                backgroundColor: selectedRacerIds.includes(racer.id) ? racer.color : '#2a2a2a', 
                borderRadius: 6 
              }}
            >
              <Text style={{ color: '#fff', fontSize: 12 }}>{racer.name}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          onPress={handleStartTestRace}
          disabled={selectedRacerIds.length === 0 || !selectedTrack}
          style={{ 
            padding: 16, 
            backgroundColor: selectedRacerIds.length === 0 || !selectedTrack ? '#444' : theme.semantic.warning, 
            borderRadius: 8 
          }}
        >
          <Text style={{ color: '#000', fontWeight: 'bold', fontSize: 16, textAlign: 'center' }}>
            Start Race ({selectedRacerIds.length} racers)
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
