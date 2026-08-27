import React from 'react';
import { Handle, Position } from '@xyflow/react';

const UnionNode: React.FC = () => {
  return (
    <div className="w-3 h-3 rounded-full bg-earbore-400 border-2 border-white shadow-sm">
      <Handle type="target" position={Position.Bottom} id="bottom-target" className="!bg-earbore-400 !w-2 !h-2" />
      <Handle type="source" position={Position.Top} id="top-source" className="!bg-earbore-400 !w-2 !h-2" />
    </div>
  );
};

export default UnionNode;