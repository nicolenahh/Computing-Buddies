import React, { useState } from 'react';
import { View, Text, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Picker } from '@react-native-picker/picker';
import { FIREBASE_AUTH, FIRESTORE_DB } from '../../firebaseConfig';
import { doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../components/AuthProvider';
import CustomButton from '../../components/CustomButton';
import { router } from 'expo-router';
import DropdownComponent from '../../components/DropdownComponent';

const YearCourse = () => {
    const yearData = [
        { label: 'Year 1', value: '1' },
        { label: 'Year 2', value: '2' },
        { label: 'Year 3', value: '3' },
        { label: 'Year 4', value: '4' }
    ];

    const courseData = [
        { label: 'Architecture', value: 'Architecture' },
        { label: 'Biomedical Engineering', value: 'Biomedical Engineering' },
        { label: 'Business Administration', value: 'Business Administration' },
        { label: 'Business Administration', value: 'Business Administration' },
        { label: 'Business Administration (Accountancy)', value: 'Business Administration (Accountancy)' },
        { label: 'Business Analytics', value: 'Business Analytics' },
        { label: 'Chemical Engineering', value: 'Chemical Engineering' },
        { label: 'Chinese Language', value: 'Chinese Language' },
        { label: 'Chinese Studies', value: 'Chinese Studies' },
        { label: 'Civil Engineering', value: 'Civil Engineering' },
        { label: 'Computer Engineering', value: 'Computer Engineering' },
        { label: 'Computer Science', value: 'Computer Science' },
        { label: 'Data Science and Economics', value: 'Data Science and Economics' },
        { label: 'Dentistry', value: 'Dentistry' },
        { label: 'Electrical Engineering', value: 'Electrical Engineering' },
        { label: 'Engineering and Medicine', value: 'Engineering and Medicine' },
        { label: 'Engineering Science', value: 'Engineering Science' },
        { label: 'English Language and Linguistics', value: 'English Language and Linguistics' },
        { label: 'English Literature', value: 'English Literature' },
        { label: 'Environmental Engineering', value: 'Environmental Engineering' },
        { label: 'Environmental Studies', value: 'Environmental Studies' },
        { label: 'Food Science and Technology', value: 'Food Science and Technology' },
        { label: 'Global Studies', value: 'Global Studies' },
        { label: 'History', value: 'History' },
        { label: 'Industrial Design', value: 'Industrial Design' },
        { label: 'Industrial and Systems Engineering', value: 'Industrial and Systems Engineering' },
        { label: 'Information Security', value: 'Information Security' },
        { label: 'Information Systems', value: 'Information Systems' },
        { label: 'Infrastructure and Project Management', value: 'Infrastructure and Project Management' },
        { label: 'Japanese Studies', value: 'Japanese Studies' },
        { label: 'Landscape Architecture', value: 'Landscape Architecture' },
        { label: 'Law', value: 'Law' },
        { label: 'Malay Studies', value: 'Malay Studies' },
        { label: 'Materials Science and Engineering', value: 'Materials Science and Engineering' },
        { label: 'Mechanical Engineering', value: 'Mechanical Engineering' },
        { label: 'Medicine', value: 'Medicine' },
        { label: 'Music', value: 'Music' },
        { label: 'Nursing', value: 'Nursing' },
        { label: 'Pharmaceutical Science', value: 'Pharmaceutical Science' },
        { label: 'Pharmacy', value: 'Pharmacy' },
        { label: 'Philosophy', value: 'Philosophy' },
        { label: 'Philosophy, Politics and Economics', value: 'Philosophy, Politics and Economics' },
        { label: 'Real Estate', value: 'Real Estate' },
        { label: 'South Asian Studies', value: 'South Asian Studies' },
        { label: 'Southeast Asian Studies', value: 'Southeast Asian Studies' },
        { label: 'Special Programme in Science', value: 'Special Programme in Science' },
        { label: 'Theatre and Performance Studies', value: 'Theatre and Performance Studies' },
    ]

    const [yearOfStudy, setYearOfStudy] = useState('');
    const [course, setCourse] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    const handleNext = async () => {
        setIsSubmitting(true);
        try {
            if (!user) {
                throw new Error('User not authenticated');
            }

            // Save the user's year of study and course to Firestore
            await setDoc(doc(FIRESTORE_DB, 'users', user.uid), {
                yearOfStudy: yearOfStudy,
                course: course
            }, { merge: true }); // Merge to avoid overwriting existing data

            // Navigate to the next step or home
            router.push('/final');
        } catch (error) {
            console.log(error);
            alert('Failed to save data: ' + error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <SafeAreaView className="h-full">
            <ScrollView>
                <View className="w-full h-full justify-center min-h-[80vh] px-4">
                    <Text className="text-2xl font-psemibold text-semibold mt-10">
                        Select your year of study
                    </Text>
                    <View className="border border-gray-300 rounded mt-5">
                        <DropdownComponent
                            data={yearData}
                            placeholder="Select Year"
                            onChange={setYearOfStudy}
                        />
                    </View>

                    <Text className="text-2xl font-psemibold text-semibold mt-10">
                        Select your course of study
                    </Text>
                    <View className="mt-5">
                        <DropdownComponent
                            data={courseData}
                            placeholder="Select Course"
                            onChange={setCourse}
                        />
                    </View>

                    <CustomButton
                        title="Next"
                        handlePress={handleNext}
                        containerStyles="mt-7"
                        isLoading={isSubmitting}
                    />
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

export default YearCourse;
