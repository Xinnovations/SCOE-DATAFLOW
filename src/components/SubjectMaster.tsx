import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { SUBJECTS } from '@/types/student';
import { BookOpen, Plus, Minus, GraduationCap, Clock } from "lucide-react";

const SubjectMaster = () => {
  const { toast } = useToast();
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [currentSelection, setCurrentSelection] = useState<string>('');

  const handleAddSubject = () => {
    if (!currentSelection) {
      toast({
        title: "No subject selected",
        description: "Please select a subject to add",
        variant: "destructive",
      });
      return;
    }

    if (selectedSubjects.includes(currentSelection)) {
      toast({
        title: "Subject already added",
        description: "This subject is already in your selection",
        variant: "destructive",
      });
      return;
    }

    setSelectedSubjects(prev => [...prev, currentSelection]);
    setCurrentSelection('');
    
    const subject = SUBJECTS.find(s => s.id === currentSelection);
    toast({
      title: "Subject added",
      description: `${subject?.name} has been added to your selection`,
    });
  };

  const handleRemoveSubject = (subjectId: string) => {
    setSelectedSubjects(prev => prev.filter(id => id !== subjectId));
    
    const subject = SUBJECTS.find(s => s.id === subjectId);
    toast({
      title: "Subject removed",
      description: `${subject?.name} has been removed from your selection`,
    });
  };

  const clearAllSubjects = () => {
    setSelectedSubjects([]);
    toast({
      title: "All subjects cleared",
      description: "Your subject selection has been reset",
    });
  };

  const selectedSubjectDetails = selectedSubjects.map(id => 
    SUBJECTS.find(s => s.id === id)
  ).filter(Boolean);

  const totalCredits = selectedSubjectDetails.reduce((sum, subject) => sum + (subject?.credits || 0), 0);

  const availableSubjects = SUBJECTS.filter(subject => 
    !selectedSubjects.includes(subject.id)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Subject Master
          </CardTitle>
          <CardDescription>
            Manage and organize academic subjects for your institution
          </CardDescription>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Subjects */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Available Subjects</CardTitle>
            <CardDescription>
              Select subjects to add to your curriculum
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Choose Subject</Label>
              <Select value={currentSelection} onValueChange={setCurrentSelection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a subject to add" />
                </SelectTrigger>
                <SelectContent>
                  {availableSubjects.map((subject) => (
                    <SelectItem key={subject.id} value={subject.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{subject.name}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {subject.code} - {subject.credits} credits
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button 
              onClick={handleAddSubject}
              disabled={!currentSelection}
              className="w-full bg-gradient-primary hover:bg-primary-hover"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Subject
            </Button>

            {/* All Subjects List */}
            <div className="mt-6">
              <h4 className="font-medium mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4" />
                All Available Subjects
              </h4>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {SUBJECTS.map((subject) => (
                  <div 
                    key={subject.id} 
                    className={`p-3 rounded-lg border transition-colors ${
                      selectedSubjects.includes(subject.id) 
                        ? 'bg-success/10 border-success/30' 
                        : 'bg-card border-border hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{subject.name}</p>
                        <p className="text-xs text-muted-foreground">{subject.code}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-xs">
                          <Clock className="mr-1 h-3 w-3" />
                          {subject.credits}
                        </Badge>
                        {selectedSubjects.includes(subject.id) && (
                          <Badge variant="default" className="text-xs bg-success text-success-foreground">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Selected Subjects */}
        <Card className="shadow-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Selected Subjects</CardTitle>
                <CardDescription>
                  Current subject selection ({selectedSubjects.length} subjects)
                </CardDescription>
              </div>
              {selectedSubjects.length > 0 && (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={clearAllSubjects}
                  className="text-destructive hover:bg-destructive/10"
                >
                  Clear All
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedSubjects.length === 0 ? (
              <div className="text-center py-8">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No subjects selected yet</p>
                <p className="text-sm text-muted-foreground">
                  Choose subjects from the available list
                </p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="bg-gradient-card p-4 rounded-lg border">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Total Credits</p>
                      <p className="text-2xl font-bold text-primary">{totalCredits}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">Subjects Count</p>
                      <p className="text-2xl font-bold text-primary">{selectedSubjects.length}</p>
                    </div>
                  </div>
                </div>

                {/* Selected Subjects List */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {selectedSubjectDetails.map((subject) => (
                    subject && (
                      <div key={subject.id} className="flex items-center justify-between p-3 bg-card border rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium">{subject.name}</p>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="secondary" className="text-xs">
                              {subject.code}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              <Clock className="mr-1 h-3 w-3" />
                              {subject.credits} credits
                            </Badge>
                          </div>
                        </div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRemoveSubject(subject.id)}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                      </div>
                    )
                  ))}
                </div>

                {/* Actions */}
                <div className="pt-4 border-t">
                  <div className="grid grid-cols-2 gap-2">
                    <Button variant="outline" className="w-full">
                      Save as Template
                    </Button>
                    <Button className="w-full bg-gradient-primary hover:bg-primary-hover">
                      Apply to Students
                    </Button>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Subject Statistics */}
      {selectedSubjects.length > 0 && (
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="text-lg">Subject Analysis</CardTitle>
            <CardDescription>
              Overview of your selected subjects
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">{totalCredits}</div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {Math.round(totalCredits / selectedSubjects.length * 10) / 10}
                </div>
                <p className="text-sm text-muted-foreground">Average Credits per Subject</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-primary mb-2">
                  {Math.ceil(totalCredits / 4)}
                </div>
                <p className="text-sm text-muted-foreground">Estimated Semesters</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SubjectMaster;