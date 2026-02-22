import React from 'react';
import { View } from 'react-native';
import Svg, { Path, Circle, G, Rect, Line } from 'react-native-svg';
import Animated, { useAnimatedProps, SharedValue } from 'react-native-reanimated';
import { Racer, Track } from '../gameTypes';

// Create Animated components for Reanimated
const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedG = Animated.createAnimatedComponent(G);

interface RaceTrackProps {
  racers: Racer[];
  track: Track;
  progressMap: Record<string, SharedValue<number>>;
}

const TRACK_WIDTH = 700;
const TRACK_HEIGHT = 500;
const CX = TRACK_WIDTH / 2;
const CY = TRACK_HEIGHT / 2;

// Stadium Shape Constants
const R_BASE = 70; // Radius of the turns
const S_LEN = 200; // Length of the straightaways

const RacerDot = ({ racer, progress, laneIndex, totalLanes, totalLaps }: { racer: Racer; progress: SharedValue<number>; laneIndex: number; totalLanes: number; totalLaps: number }) => {
  if (!progress) return null;

  // Each racer gets their own lane with proper spacing
  // Distribute lanes evenly across the track width
  const laneSpacing = 18; // Pixels between lane centers
  const laneOffset = (laneIndex - (totalLanes - 1) / 2) * laneSpacing;
  const R = R_BASE + 70 + laneOffset; // Start from inner track edge
  const S = S_LEN;
  const singleLapPathLen = 2 * S + 2 * Math.PI * R;

  const animatedProps = useAnimatedProps(() => {
    // progress.value is total race progress (0-1)
    // Calculate which "virtual lap" we're on (can exceed total laps during final lap)
    const virtualLapNumber = progress.value * totalLaps;
    const currentLapDistance = (virtualLapNumber % 1) * singleLapPathLen;
    
    let x = CX;
    let y = CY;

    // Logic to follow stadium path starting Top Center, moving CCW
    // 1. Top Straight (Left half)
    if (currentLapDistance < S / 2) {
      x = CX - currentLapDistance;
      y = CY - R;
    } 
    // 2. Left Turn
    else if (currentLapDistance < S / 2 + Math.PI * R) {
      const dArc = currentLapDistance - S / 2;
      const angle = 1.5 * Math.PI - (dArc / R); // 270 -> 90
      x = (CX - S / 2) + R * Math.cos(angle);
      y = CY + R * Math.sin(angle);
    }
    // 3. Bottom Straight
    else if (currentLapDistance < S / 2 + Math.PI * R + S) {
      const dStr = currentLapDistance - (S / 2 + Math.PI * R);
      x = (CX - S / 2) + dStr;
      y = CY + R;
    }
    // 4. Right Turn
    else if (currentLapDistance < S / 2 + Math.PI * R + S + Math.PI * R) {
      const dArc = currentLapDistance - (S / 2 + Math.PI * R + S);
      const angle = 0.5 * Math.PI - (dArc / R); // 90 -> -90
      x = (CX + S / 2) + R * Math.cos(angle);
      y = CY + R * Math.sin(angle);
    }
    // 5. Top Straight (Right half)
    else {
      const dStr = currentLapDistance - (S / 2 + 2 * Math.PI * R + S);
      x = (CX + S / 2) - dStr;
      y = CY - R;
    }

    return {
      cx: x,
      cy: y,
    };
  });

  return (
    <AnimatedG>
      <AnimatedCircle
        r={8}
        fill={racer.color}
        stroke="white"
        strokeWidth={2}
        animatedProps={animatedProps}
      />
    </AnimatedG>
  );
};

export const RaceTrack: React.FC<RaceTrackProps> = ({ racers, track, progressMap }) => {
  const getSurfaceColor = () => {
    switch (track.surface) {
      case 'dirt': return '#451a03'; // Amber 950
      case 'grass': return '#052e16'; // Green 950
      default: return '#1e293b'; // Slate 800
    }
  };

  // Helper to generate stadium path data
  const getStadiumPath = (offset: number) => {
    const R = R_BASE + offset;
    const S = S_LEN;
    // Start Top Center
    return `
      M ${CX} ${CY - R}
      L ${CX - S / 2} ${CY - R}
      A ${R} ${R} 0 0 0 ${CX - S / 2} ${CY + R}
      L ${CX + S / 2} ${CY + R}
      A ${R} ${R} 0 0 0 ${CX + S / 2} ${CY - R}
      L ${CX} ${CY - R}
    `;
  };

  return (
    <View 
      className="flex-1 items-center justify-center rounded-3xl m-2 overflow-hidden"
      style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#4A895C', borderRadius: 24, margin: 8, overflow: 'hidden' }}
    >
      <Svg height={TRACK_HEIGHT} width={TRACK_WIDTH} viewBox={`0 0 ${TRACK_WIDTH} ${TRACK_HEIGHT}`}>
        {/* Track Surface */}
        <Path
          d={getStadiumPath(150)}
          fill={getSurfaceColor()}
          stroke="none"
        />
        
        {/* Track Lane */}
        <Path
          d={getStadiumPath(66)}
          fill="none"
          stroke="rgba(0,0,0,0.4)"
          strokeWidth={152}
        />
        
        {/* Dashed Center Line */}
        <Path
          d={getStadiumPath(66)}
          fill="none"
          stroke="rgba(255,255,255,0.1)"
          strokeWidth={2}
          strokeDasharray="15,15"
        />
        
        {/* Lane Dividers */}
        {Array.from({ length: Math.max(8, racers.length) }, (_, index) => {
          const laneSpacing = 18;
          const laneOffset = (index - (Math.max(8, racers.length) - 1) / 2) * laneSpacing;
          const R = R_BASE + 70 + laneOffset;
          return (
            <Path
              key={`lane-${index}`}
              d={`
                M ${CX} ${CY - R}
                L ${CX - S_LEN / 2} ${CY - R}
                A ${R} ${R} 0 0 0 ${CX - S_LEN / 2} ${CY + R}
                L ${CX + S_LEN / 2} ${CY + R}
                A ${R} ${R} 0 0 0 ${CX + S_LEN / 2} ${CY - R}
                L ${CX} ${CY - R}
              `}
              fill="none"
              stroke="rgba(255,255,255,0.05)"
              strokeWidth={1}
            />
          );
        })}

        {/* Inner Field (Grass) */}
        <Path
          d={getStadiumPath(-10)}
          fill="#4A895C"
          stroke="#1e293b"
          strokeWidth={2}
        />
        
        {/* Start/Finish Line */}
        <G transform={`rotate(0, ${CX}, ${CY})`}>
           {/* Checkered Line */}
           <Line x1={CX} y1={CY - R_BASE + 10} x2={CX} y2={CY - R_BASE - 150} stroke="rgba(255,255,255,0.5)" strokeWidth={4} strokeDasharray="4,4" />
           {/* Finish Post */}
           <Rect x={CX - 2} y={CY - R_BASE - 150} width={4} height={160} fill="#ffffff" />
           <Circle cx={CX} cy={CY - R_BASE - 150} r={6} fill="#ffffff" />
        </G>

        {/* Racers */}
        {racers.map((racer) => (
          <RacerDot 
            key={racer.id} 
            racer={racer} 
            progress={progressMap[racer.id]}
            laneIndex={racer.lane - 1} // Convert 1-based lane to 0-based index for calculations
            totalLanes={Math.max(8, racers.length)}
            totalLaps={track.laps}
          />
        ))}
      </Svg>
    </View>
  );
};