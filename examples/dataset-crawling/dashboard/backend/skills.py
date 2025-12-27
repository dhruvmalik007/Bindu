from typing import List, Dict, Optional, Any
import yaml
import os
from pydantic import BaseModel
from pathlib import Path

class SkillMetadata(BaseModel):
    id: str
    name: str
    version: str
    description: str
    author: str

class Skill(BaseModel):
    metadata: SkillMetadata
    tags: List[str]
    input_modes: List[str]
    output_modes: List[str]
    capabilities: Dict[str, Any]
    requirements: Dict[str, Any]
    performance: Dict[str, Any]
    documentation: Dict[str, Any]

class SkillsRegistry:
    def __init__(self, skills_dir: Optional[str] = None):
        self.skills: Dict[str, Skill] = {}
        if skills_dir is None:
            self.skills_dir = str(Path(__file__).resolve().parent / "skills")
        else:
            self.skills_dir = skills_dir
        # Ensure skills directory exists
        os.makedirs(self.skills_dir, exist_ok=True)
        self.load_skills()

    def load_skills(self):
        """Load all skills from the skills directory."""
        if not os.path.exists(self.skills_dir):
            return

        for filename in os.listdir(self.skills_dir):
            if filename.endswith(".yaml") or filename.endswith(".yml"):
                try:
                    with open(os.path.join(self.skills_dir, filename), 'r') as f:
                        skill_data = yaml.safe_load(f)
                        # Basic validation/mapping
                        meta = skill_data.get('id', '')
                        if meta:
                            # In a real impl, map fields to pydantic model
                            # For now, just storing raw data or minimal object
                            self.skills[meta] = skill_data
                except Exception as e:
                    print(f"Failed to load skill {filename}: {e}")

    def list_skills(self) -> List[Dict]:
        return list(self.skills.values())

    def get_skill(self, skill_id: str) -> Optional[Dict]:
        return self.skills.get(skill_id)

    def register_skill(self, skill_data: Dict):
        """Register a new skill dynamically."""
        skill_id = skill_data.get('id')
        if skill_id:
            self.skills[skill_id] = skill_data
            # Save to disk
            with open(os.path.join(self.skills_dir, f"{skill_id}.yaml"), 'w') as f:
                yaml.dump(skill_data, f)
