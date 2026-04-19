"""
FaceStorage — utility for saving detected face images to disk.

Stores captured faces in organized directory structure for later verification and identification.
"""

import os
import cv2
import uuid
from pathlib import Path
from datetime import datetime
from typing import List
import json

from app.core.logging import get_logger

logger = get_logger(__name__)


class FaceStorage:
    """Manages storage and organization of detected face images."""

    def __init__(self, base_dir: str = "detected_faces"):
        """
        Initialize face storage.

        Args:
            base_dir: Root directory for storing face images.
        """
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(parents=True, exist_ok=True)
        logger.info("FaceStorage initialized: base_dir=%s", self.base_dir)

    def save_face_images(self, faces: List, frame_index: int, video_filename: str) -> dict:
        """
        Save detected face images from a video frame.

        Args:
            faces: List of FaceData objects from FaceDetector.extract_faces()
            frame_index: Frame number in the video
            video_filename: Name of the source video file

        Returns:
            Dictionary with metadata about saved faces:
            {
                'session_id': str,
                'video_filename': str,
                'frame_index': int,
                'timestamp': str,
                'face_count': int,
                'faces': [
                    {
                        'face_id': int,
                        'filename': str,
                        'path': str,
                        'confidence': float,
                        'bbox': dict,
                        'person_name': str
                    },
                    ...
                ]
            }
        """
        session_id = str(uuid.uuid4())[:8]
        timestamp = datetime.now().isoformat()

        # Create session directory
        session_dir = self.base_dir / session_id
        session_dir.mkdir(parents=True, exist_ok=True)

        metadata = {
            'session_id': session_id,
            'video_filename': video_filename,
            'frame_index': frame_index,
            'timestamp': timestamp,
            'face_count': len(faces),
            'faces': []
        }

        for face_data in faces:
            # Generate filename
            face_filename = f"face_{frame_index}_id{face_data.face_id}.jpg"
            face_path = session_dir / face_filename

            # Save face image
            try:
                cv2.imwrite(str(face_path), face_data.face_image)
                logger.info("Saved face image: %s", face_path)

                face_meta = {
                    'face_id': face_data.face_id,
                    'filename': face_filename,
                    'path': str(face_path),
                    'confidence': face_data.confidence,
                    'bbox': face_data.bbox,
                    'person_name': face_data.person_name or 'Unknown'
                }
                metadata['faces'].append(face_meta)

            except Exception as e:
                logger.error("Failed to save face image: %s", e)

        # Save metadata JSON
        metadata_path = session_dir / "metadata.json"
        try:
            with open(metadata_path, 'w') as f:
                json.dump(metadata, f, indent=2, default=str)
            logger.info("Saved metadata: %s", metadata_path)
        except Exception as e:
            logger.error("Failed to save metadata: %s", e)

        return metadata

    def save_frame_with_annotations(
        self, 
        frame: object,  # numpy array
        faces: List,
        frame_index: int,
        session_id: str
    ) -> str:
        """
        Save a frame with face bounding boxes drawn for visualization.

        Args:
            frame: BGR frame image (numpy array)
            faces: List of detected faces
            frame_index: Frame number
            session_id: Session identifier for organizing output

        Returns:
            Path to saved annotated frame.
        """
        session_dir = self.base_dir / session_id
        session_dir.mkdir(parents=True, exist_ok=True)

        # Draw bounding boxes on frame
        annotated_frame = frame.copy()
        for face_data in faces:
            bbox = face_data.bbox
            x_min, y_min = bbox['x_min'], bbox['y_min']
            x_max, y_max = bbox['x_max'], bbox['y_max']

            # Draw green rectangle around face
            cv2.rectangle(annotated_frame, (x_min, y_min), (x_max, y_max), (0, 255, 0), 2)

            # Add label with confidence
            label = f"Face {face_data.face_id} ({face_data.confidence:.2f})"
            cv2.putText(
                annotated_frame, label,
                (x_min, y_min - 10),
                cv2.FONT_HERSHEY_SIMPLEX,
                0.5, (0, 255, 0), 1
            )

        # Save annotated frame
        frame_filename = f"frame_{frame_index}_annotated.jpg"
        frame_path = session_dir / frame_filename

        try:
            cv2.imwrite(str(frame_path), annotated_frame)
            logger.info("Saved annotated frame: %s", frame_path)
            return str(frame_path)
        except Exception as e:
            logger.error("Failed to save annotated frame: %s", e)
            return ""

    def get_session_faces(self, session_id: str) -> dict:
        """
        Retrieve metadata for a saved session.

        Args:
            session_id: Session identifier

        Returns:
            Metadata dictionary or empty dict if not found.
        """
        metadata_path = self.base_dir / session_id / "metadata.json"
        
        try:
            if metadata_path.exists():
                with open(metadata_path, 'r') as f:
                    return json.load(f)
        except Exception as e:
            logger.error("Failed to read session metadata: %s", e)

        return {}
