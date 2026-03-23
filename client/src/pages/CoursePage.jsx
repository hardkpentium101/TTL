import { useState } from 'react';
import { useParams, useLocation, useNavigate } from 'react-router-dom';
import LessonRenderer from '../components/LessonRenderer';
import LessonPDFExporter from '../components/LessonPDFExporter';

export default function CoursePage() {
  const { courseTitle } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const course = location.state?.course;

  const [selectedModule, setSelectedModule] = useState(0);
  const [selectedLesson, setSelectedLesson] = useState(0);

  if (!course) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400 mb-4">
          Course not found. Please generate a course first.
        </p>
        <button
          onClick={() => navigate('/')}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
        >
          Go Home
        </button>
      </div>
    );
  }

  const currentModule = course.modules?.[selectedModule];
  const currentLesson = currentModule?.lessons?.[selectedLesson];

  return (
    <div className="max-w-7xl mx-auto">
      {/* Course Header */}
      <div className="mb-8">
        <button
          onClick={() => navigate('/')}
          className="text-blue-600 hover:text-blue-700 dark:text-blue-400 mb-4"
        >
          ← Back to Home
        </button>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          {course.title}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">{course.description}</p>
        
        {/* Metadata */}
        {course.metadata && (
          <div className="flex flex-wrap gap-4 mb-4">
            <span className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 px-3 py-1 rounded-full text-sm">
              📊 Level: {course.metadata.level}
            </span>
            <span className="bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-sm">
              ⏱️ Duration: {course.metadata.estimated_duration}
            </span>
          </div>
        )}
        
        <div className="flex flex-wrap gap-2">
          {course.metadata?.prerequisites?.map((prereq, index) => (
            <span
              key={index}
              className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1 rounded-full text-sm"
            >
              📌 {prereq}
            </span>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Module & Lesson Sidebar */}
        <div className="lg:col-span-1 space-y-4">
          {course.modules?.map((module, moduleIndex) => (
            <div
              key={module.id || moduleIndex}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden"
            >
              <div className="bg-gray-50 dark:bg-gray-700 px-4 py-3">
                <h3 className="font-semibold text-gray-800 dark:text-gray-200">
                  Module {moduleIndex + 1}: {module.title}
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {module.description}
                </p>
              </div>
              <div className="divide-y divide-gray-200 dark:divide-gray-700">
                {module.lessons?.map((lesson, lessonIndex) => (
                  <button
                    key={lesson.id || lessonIndex}
                    onClick={() => {
                      setSelectedModule(moduleIndex);
                      setSelectedLesson(lessonIndex);
                    }}
                    className={`w-full text-left px-4 py-3 text-sm transition-colors ${
                      selectedModule === moduleIndex && selectedLesson === lessonIndex
                        ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    📄 {lesson.title}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Lesson Content */}
        <div className="lg:col-span-3">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
            {currentLesson && (
              <>
                <div className="mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-3">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                      {currentLesson.title}
                    </h2>
                    <LessonPDFExporter
                      lesson={currentLesson}
                      courseTitle={course.title}
                      moduleName={currentModule.title}
                    />
                  </div>
                  {currentLesson.objectives && (
                    <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4 mb-4">
                      <h4 className="font-semibold text-green-800 dark:text-green-300 mb-2">
                        🎯 Learning Objectives
                      </h4>
                      <ul className="space-y-1">
                        {currentLesson.objectives.map((objective, index) => (
                          <li
                            key={index}
                            className="text-green-700 dark:text-green-400 text-sm flex items-start"
                          >
                            <span className="mr-2">•</span>
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {currentLesson.key_topics && (
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                      <h4 className="font-semibold text-blue-800 dark:text-blue-300 mb-2">
                        📚 Key Topics
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {currentLesson.key_topics.map((topic, index) => (
                          <span
                            key={index}
                            className="bg-white dark:bg-gray-800 text-blue-700 dark:text-blue-300 px-3 py-1 rounded-full text-xs"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <LessonRenderer content={currentLesson.content} />
                
                {/* Resources Section */}
                {currentLesson.resources && currentLesson.resources.length > 0 && (
                  <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">
                      🔗 Additional Resources
                    </h4>
                    <ul className="space-y-2">
                      {currentLesson.resources.map((resource, index) => (
                        <li key={index}>
                          <a
                            href={resource.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 text-sm flex items-center"
                          >
                            <span className="mr-2">📖</span>
                            {resource.title}
                            <span className="ml-1 text-xs">↗</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
