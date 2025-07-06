import React, { useRef, useEffect } from 'react';

interface ComplianceLiquidGaugeProps {
  percentage: number; // 0-100
  width?: number;
  height?: number;
}

export const ComplianceLiquidGauge: React.FC<ComplianceLiquidGaugeProps> = ({
  percentage,
  width = 180,
  height = 180,
}) => {
  const waveRef = useRef<SVGPathElement>(null);
  const animRef = useRef<number>();

  // Pick gradient color based on percentage
  let gradientId = 'liquid-gradient-blue';
  if (percentage < 60) gradientId = 'liquid-gradient-red';
  else if (percentage > 80) gradientId = 'liquid-gradient-green';

  // Animation state
  useEffect(() => {
    let phase = 0;
    let running = true;
    const animate = () => {
      if (!waveRef.current) return;
      const waveWidth = width;
      const waveHeight = height / 18; // wave amplitude
      const waveLength = width * 1.2;
      const centerY = height / 2;
      const radius = width / 2;
      const fillLevel = height - (percentage / 100) * height;
      let path = '';
      for (let x = 0; x <= waveLength; x += 2) {
        const px = x;
        const py =
          fillLevel +
          Math.sin((x / waveLength) * 2 * Math.PI + phase) * waveHeight;
        path += x === 0 ? `M${px},${py}` : ` L${px},${py}`;
      }
      // Complete the path
      path += ` L${waveLength},${height}`;
      path += ` L0,${height} Z`;
      if (waveRef.current) waveRef.current.setAttribute('d', path);
      phase += 0.04;
      if (running) animRef.current = requestAnimationFrame(animate);
    };
    animRef.current = requestAnimationFrame(animate);
    return () => {
      running = false;
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [percentage, width, height]);

  return (
    <div style={{ width, height, position: 'relative', display: 'inline-block' }}>
      <svg width={width} height={height} style={{ display: 'block' }}>
        {/* Outer Circle */}
        <circle
          cx={width / 2}
          cy={height / 2}
          r={width / 2 - 4}
          fill="#181e2a"
          stroke="#2563eb"
          strokeWidth={4}
        />
        {/* Clipped Wave */}
        <clipPath id="liquid-clip">
          <circle cx={width / 2} cy={height / 2} r={width / 2 - 4} />
        </clipPath>
        <g clipPath="url(#liquid-clip)">
          <path
            ref={waveRef}
            fill={`url(#${gradientId})`}
            opacity={0.85}
          />
        </g>
        <defs>
          <linearGradient id="liquid-gradient-blue" x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
            <stop stopColor="#3b82f6" />
            <stop offset="1" stopColor="#a78bfa" />
          </linearGradient>
          <linearGradient id="liquid-gradient-red" x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
            <stop stopColor="#ef4444" />
            <stop offset="1" stopColor="#f472b6" />
          </linearGradient>
          <linearGradient id="liquid-gradient-green" x1="0" y1="0" x2="0" y2={height} gradientUnits="userSpaceOnUse">
            <stop stopColor="#22c55e" />
            <stop offset="1" stopColor="#3b82f6" />
          </linearGradient>
        </defs>
      </svg>
      {/* Percentage Text */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: width / 4,
          fontWeight: 700,
          color: '#fff',
          textShadow: '0 2px 16px #181e2a, 0 0 8px #3b82f6',
          pointerEvents: 'none',
          userSelect: 'none',
        }}
      >
        {Math.round(percentage)}%
      </div>
    </div>
  );
}; 