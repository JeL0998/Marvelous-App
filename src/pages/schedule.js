import { useEffect, useState } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { db } from '@/lib/firebaseConfig';
import { motion } from 'framer-motion';

export default function ScheduleManagement() {
  const [courses, setCourses] = useState([]);
  const router = useRouter();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const fetchCollection = async (path) => {
          const snapshot = await getDocs(collection(db, path));
          return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        };

        const boardCourses = await fetchCollection('Departments/Board Courses/Courses');
        const nonBoardCourses = await fetchCollection('Departments/Non-Board Courses/Courses');

        setCourses([...boardCourses, ...nonBoardCourses]);
      } catch (error) {
        console.error("Error fetching courses:", error);
      }
    };

    fetchCourses();
  }, []);

  const handleCourseClick = (courseId) => router.push(`/schedule/${courseId}`);

  return (
    <Layout>
      <motion.div
        className="p-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-6 border-b pb-2">Class Schedules</h1>
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {courses.map(({ id, name }) => (
            <motion.div
              key={id}
              onClick={() => handleCourseClick(id)}
              className="p-4 bg-white rounded-lg shadow hover:shadow-lg cursor-pointer transition-transform transform hover:scale-105"
              whileHover={{ scale: 1.05, boxShadow: "0 8px 16px rgba(0,0,0,0.2)" }}
              whileTap={{ scale: 0.95 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <h2 className="text-xl font-semibold mb-2 border-b pb-2">{id}</h2>
              <p className="text-gray-500">{name}</p>
            </motion.div>
          ))}
        </motion.div>
      </motion.div>
    </Layout>
  );
}
