import React, { useState, useEffect, useMemo } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, doc, writeBatch, onSnapshot, updateDoc, setLogLevel } from 'firebase/firestore';
import { Search, CheckCircle, Star, Users, LogIn, Clock, XCircle, Crown, Undo2 } from 'lucide-react';

// --- Firebase Configuration (for Netlify deployment) ---
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};
const appId = import.meta.env.VITE_CUSTOM_APP_ID || 'default-wedding-app';

// --- Initial Guest Data from PDF (VERBATIM) ---
const initialGuestData = [
    { title: "Mr", lastName: "ABBI", firstName: "Blaise (Ex. Ministre)", category: "VIP", table: "1" },
    { title: "Mme", lastName: "ABBI", firstName: "Blaise", category: "VIP", table: "1" },
    { title: "Mr", lastName: "ABLO", firstName: "Jean Marc Auxence", category: "", table: "13" },
    { title: "Mme", lastName: "ABLO", firstName: "Jean Marc", category: "", table: "13" },
    { title: "Mr", lastName: "ACKO", firstName: "Maurice", category: "", table: "7" },
    { title: "Mme", lastName: "ACKO", firstName: "Maurice", category: "", table: "7" },
    { title: "Mme", lastName: "ACKO", firstName: "Cocotte", category: "", table: "10" },
    { title: "Mme", lastName: "ACKO", firstName: "Elisabeth", category: "", table: "10" },
    { title: "Mr", lastName: "ADAHOULIN", firstName: "Maurice (Chef de Famille)", category: "VIP", table: "2" },
    { title: "Mme", lastName: "ADAYE", firstName: "Jeanne", category: "VIP", table: "5" },
    { title: "MR", lastName: "ADAYE", firstName: "YANN KEVIN", category: "", table: "31" },
    { title: "", lastName: "ADAYE", firstName: "Claude Hervé", category: "", table: "28" },
    { title: "MR", lastName: "ADIKO", firstName: "YVES JOEL", category: "", table: "35" },
    { title: "", lastName: "ADJA", firstName: "Gisèle ADJA", category: "", table: "14" },
    { title: "MME", lastName: "ADJOUMANI", firstName: "AUDE", category: "", table: "24" },
    { title: "", lastName: "ADJOUMANI", firstName: "Marika", category: "", table: "24" },
    { title: "", lastName: "ADOM", firstName: "George Alexandre", category: "", table: "29" },
    { title: "Mr", lastName: "ADOU", firstName: "AUGUSTE", category: "", table: "7" },
    { title: "Mr", lastName: "ADOU", firstName: "Yvon Adou", category: "", table: "35" },
    { title: "MME", lastName: "ADOU", firstName: "Yvon Adou", category: "", table: "35" },
    { title: "", lastName: "ADOU", firstName: "Yves arnaud", category: "", table: "37" },
    { title: "Mme", lastName: "AFFIAN", firstName: "Chantal", category: "VIP", table: "9" },
    { title: "Mr", lastName: "AFFIAN", firstName: "Jean-Marc", category: "VIP", table: "9" },
    { title: "", lastName: "AHMED", firstName: "Thomas", category: "", table: "37" },
    { title: "Mr", lastName: "AHOUANAN", firstName: "Richard", category: "", table: "10" },
    { title: "", lastName: "AHOUANAN", firstName: "Marie-Ange", category: "", table: "17" },
    { title: "Mme", lastName: "AHOUANAN", firstName: "Cedric", category: "", table: "10" },
    { title: "Mme", lastName: "AHOUANAN", firstName: "Virginie", category: "", table: "10" },
    { title: "", lastName: "AHOUSSI", firstName: "Mireille Ahoussi", category: "VIP", table: "9" },
    { title: "", lastName: "AHOUSSI", firstName: "Louis Emmanuel", category: "", table: "32" },
    { title: "MR", lastName: "AHOUSSOU", firstName: "CYRILLE", category: "", table: "30" },
    { title: "MME", lastName: "AHOUSSOU", firstName: "KARINE", category: "", table: "30" },
    { title: "MR", lastName: "AHOUSSOU", firstName: "CEDRIC", category: "", table: "30" },
    { title: "MR", lastName: "AHOUSSOU", firstName: "MAGICE LYNDSAY", category: "", table: "30" },
    { title: "", lastName: "AJAVON", firstName: "NAUSSICA", category: "DH", table: "28" },
    { title: "MonSeigneur", lastName: "AKA", firstName: "Joseph Kakou", category: "VIP", table: "1" },
    { title: "", lastName: "AKA", firstName: "Marco", category: "GH", table: "28" },
    { title: "", lastName: "AKA", firstName: "Stephane Martin", category: "", table: "33" },
    { title: "", lastName: "AKA", firstName: "Andréa", category: "", table: "37" },
    { title: "Mr", lastName: "AKA - KROO", firstName: "Roger", category: "VIP", table: "3" },
    { title: "Mme", lastName: "AKA - KROO", firstName: "Cécile", category: "VIP", table: "3" },
    { title: "Mme", lastName: "AKA-KROO", firstName: "Marie Rose", category: "VIP", table: "3" },
    { title: "DR", lastName: "AKE", firstName: "ALLAN (TOGO)", category: "", table: "27" },
    { title: "Mme", lastName: "AKE", firstName: "Simon", category: "Porte-Parole", table: "10" },
    { title: "MME", lastName: "ALEXANDRA", firstName: "CACOU", category: "", table: "31" },
    { title: "MR", lastName: "AMAH", firstName: "SYLVIE PHACIE CATLEYAS", category: "", table: "20" },
    { title: "Mr", lastName: "AMANI", firstName: "Jean Didier", category: "VIP", table: "5" },
    { title: "Mme", lastName: "AMANI", firstName: "Jean Didier", category: "VIP", table: "5" },
    { title: "Mr", lastName: "AMANY", firstName: "Kouame", category: "VIP", table: "2" },
    { title: "Mme", lastName: "AMANY", firstName: "Kouame", category: "VIP", table: "2" },
    { title: "", lastName: "AMANY", firstName: "Cedric", category: "", table: "32" },
    { title: "", lastName: "AMANY", firstName: "Naomie", category: "", table: "32" },
    { title: "", lastName: "AMESSAN", firstName: "Jean Rene", category: "", table: "37" },
    { title: "", lastName: "AMICHIA", firstName: "Alexia", category: "", table: "36" },
    { title: "", lastName: "AMICHIA", firstName: "Yannick", category: "", table: "36" },
    { title: "Mme", lastName: "AMISSAH", firstName: "Angèle", category: "VIP", table: "1" },
    { title: "Mr", lastName: "AMISSAH", firstName: "Samuel", category: "VIP", table: "1" },
    { title: "MME", lastName: "AMON", firstName: "BETTY", category: "", table: "7" },
    { title: "MME", lastName: "AMON", firstName: "KONDOH LAURENCE", category: "VIP", table: "23" },
    { title: "MME", lastName: "AMON", firstName: "THERERE", category: "VIP", table: "23" },
    { title: "MME", lastName: "AMOUSSOU", firstName: "MARINA", category: "", table: "26" },
    { title: "", lastName: "AMY", firstName: "BAH", category: "", table: "26" },
    { title: "", lastName: "ANGATE", firstName: "Tita", category: "", table: "29" },
    { title: "MME", lastName: "ANGUY", firstName: "", category: "VIP", table: "23" },
    { title: "MR", lastName: "ANSELME", firstName: "DJEDJE", category: "VIP", table: "25" },
    { title: "MR", lastName: "ANTIDOTE", firstName: "Antidote", category: "", table: "37" },
    { title: "MME", lastName: "AOUSS", firstName: "YOLENE", category: "", table: "17" },
    { title: "MME", lastName: "AOUSS", firstName: "VALERIE", category: "VIP", table: "25" },
    { title: "MR", lastName: "AOUSS", firstName: "CLEMENT", category: "VIP", table: "25" },
    { title: "MME", lastName: "ARMELLE", firstName: "MARRAINE", category: "VIP", table: "23" },
    { title: "Mr", lastName: "ASSAMOI", firstName: "Venance", category: "VIP", table: "9" },
    { title: "Mme", lastName: "ASSAMOI", firstName: "Emma", category: "VIP", table: "9" },
    { title: "MR", lastName: "ASSOUAN", firstName: "HERVE", category: "VIP", table: "21" },
    { title: "MME", lastName: "ASSOUAN", firstName: "MARYSE", category: "VIP", table: "21" },
    { title: "", lastName: "ASSOUAN", firstName: "LAETITIA", category: "", table: "34" },
    { title: "", lastName: "ASSOUAN", firstName: "Franck", category: "", table: "37" },
    { title: "MR", lastName: "ATTA", firstName: "YVES", category: "", table: "17" },
    { title: "MME", lastName: "ATTA", firstName: "DORLESSE CPV", category: "", table: "18" },
    { title: "DR", lastName: "ATTOUMGBRE", firstName: "", category: "", table: "20" },
    { title: "", lastName: "AYITE", firstName: "MAUREEN", category: "", table: "30" },
    { title: "", lastName: "BABI", firstName: "Nicole", category: "VIP", table: "6" },
    { title: "MME", lastName: "BAGROU", firstName: "EPSE PAMAH DESIRE", category: "", table: "19" },
    { title: "Mr", lastName: "BAGROU", firstName: "Christian", category: "", table: "19" },
    { title: "Mme", lastName: "BAGROU", firstName: "Christian", category: "", table: "19" },
    { title: "MR", lastName: "BAGROU", firstName: "GOLI", category: "VIP", table: "21" },
    { title: "MME", lastName: "BAGROU", firstName: "APPOLINE", category: "VIP", table: "21" },
    { title: "MR", lastName: "BAHE", firstName: "GATHIEN CPV", category: "", table: "18" },
    { title: "MME", lastName: "BAHOU", firstName: "ANGELINE CPV", category: "", table: "18" },
    { title: "MR", lastName: "BAKAYOKO", firstName: "BEN", category: "VIP", table: "21" },
    { title: "MME", lastName: "BAKAYOKO", firstName: "MAMA", category: "VIP", table: "21" },
    { title: "MR", lastName: "BAKO", firstName: "CHRIST", category: "", table: "15" },
    { title: "", lastName: "BAKO", firstName: "FABIENNE", category: "", table: "15" },
    { title: "MR", lastName: "BAKO", firstName: "FABRICE", category: "", table: "15" },
    { title: "", lastName: "BAKO", firstName: "RUTH", category: "", table: "15" },
    { title: "MR", lastName: "BAKO", firstName: "STEPHANE", category: "", table: "17" },
    { title: "MME", lastName: "BAKO", firstName: "CHARLENE", category: "", table: "17" },
    { title: "MME", lastName: "BAKO", firstName: "DELPHINE", category: "", table: "19" },
    { title: "MME", lastName: "BAKO", firstName: "MEME ROSALIE", category: "VIP", table: "22" },
    { title: "MME", lastName: "BAKO", firstName: "JUSTINE", category: "VIP", table: "25" },
    { title: "MR", lastName: "BAKO", firstName: "FULBERT", category: "VIP", table: "25" },
    { title: "MME", lastName: "BAKO", firstName: "CLARA", category: "VIP", table: "25" },
    { title: "MR", lastName: "BALLIET", firstName: "YANN", category: "", table: "11" },
    { title: "MME", lastName: "BALLIET", firstName: "MARIE CHARLOTTE", category: "", table: "11" },
    { title: "Mr", lastName: "BAMA", firstName: "Franck Olivier", category: "", table: "38" },
    { title: "Mme", lastName: "BAMA", firstName: "Leslie", category: "", table: "38" },
    { title: "MME", lastName: "BAMBA", firstName: "AMINATA CPV", category: "", table: "18" },
    { title: "DR", lastName: "BANKOLE", firstName: "", category: "", table: "20" },
    { title: "MME", lastName: "BARRY", firstName: "MAHI CPV", category: "", table: "18" },
    { title: "MR", lastName: "BARRY", firstName: "BEN TOURE", category: "", table: "33" },
    { title: "Mme", lastName: "BAZIE", firstName: "", category: "VIP", table: "3" },
    { title: "", lastName: "BEKA", firstName: "Victoria", category: "", table: "36" },
    { title: "Mr", lastName: "BEKRO", firstName: "Yves-Alain", category: "VIP", table: "3" },
    { title: "Mme", lastName: "BEKRO", firstName: "Yves", category: "VIP", table: "3" },
    { title: "", lastName: "BESSALA", firstName: "URSULA", category: "", table: "26" },
    { title: "", lastName: "BICTOGO", firstName: "MALICKA", category: "", table: "34" },
    { title: "MR", lastName: "BILE", firstName: "(VOISIN)", category: "", table: "19" },
    { title: "MME", lastName: "BILE", firstName: "(VOISIN)", category: "", table: "19" },
    { title: "", lastName: "BLAFON", firstName: "Charles", category: "", table: "33" },
    { title: "Mr", lastName: "BLE", firstName: "ARNAUD", category: "", table: "38" },
    { title: "", lastName: "BLEY", firstName: "Christ-Alexandre", category: "", table: "37" },
    { title: "MR", lastName: "BOA", firstName: "Johnson Joel", category: "", table: "35" },
    { title: "MME", lastName: "BOA", firstName: "Ina-Celly (Johnson)", category: "", table: "35" },
    { title: "", lastName: "BOGA", firstName: "Samuel", category: "", table: "26" },
    { title: "", lastName: "BOGUIFO", firstName: "Charles herman", category: "", table: "36" },
    { title: "MME", lastName: "BOLI", firstName: "CARYLE", category: "", table: "31" },
    { title: "", lastName: "BOLOU", firstName: "Ange Herbin", category: "BNETD", table: "14" },
    { title: "", lastName: "BONI", firstName: "Christiane Boni", category: "VIP", table: "9" },
    { title: "", lastName: "BONI", firstName: "Félicité Boni", category: "VIP", table: "9" },
    { title: "", lastName: "BONI", firstName: "Marie-Lynda", category: "", table: "4" },
    { title: "Mr", lastName: "BONON", firstName: "Jean Jacques", category: "", table: "10" },
    { title: "MME", lastName: "BONY", firstName: "CHARLAINE", category: "", table: "18" },
    { title: "Mr", lastName: "BOTTI", firstName: "Germain", category: "BNETD", table: "14" },
    { title: "Mme", lastName: "BOTTI", firstName: "Germain", category: "BNETD", table: "14" },
    { title: "", lastName: "BOUATENE", firstName: "NICOLAS", category: "", table: "36" },
    { title: "", lastName: "BOUEDY", firstName: "Naomi", category: "", table: "29" },
    { title: "", lastName: "BOUEDY", firstName: "Anne Désiré", category: "", table: "29" },
    { title: "MR", lastName: "BOUEDY", firstName: "Guy Stephane", category: "", table: "30" },
    { title: "MME", lastName: "BOUEDY", firstName: "Maritza", category: "", table: "30" },
    { title: "Gouverneur", lastName: "BROU", firstName: "Jean Claude Kassi (BCEAO)", category: "VIP", table: "1" },
    { title: "Mme", lastName: "BROU", firstName: "Jackie", category: "VIP", table: "1" },
    { title: "Mr", lastName: "BROU", firstName: "Amani Jean", category: "VIP", table: "23" },
    { title: "", lastName: "BROU", firstName: "Charles Sénac", category: "", table: "37" },
    { title: "", lastName: "BROU", firstName: "Manuella", category: "", table: "29" },
    { title: "DR", lastName: "BROU", firstName: "PAUL JR", category: "", table: "11" },
    { title: "REPRESENTANT", lastName: "CAMARA", firstName: "KANDIA", category: "VIP", table: "23" },
    { title: "Mlle", lastName: "CAMARA", firstName: "MASSANDJE", category: "", table: "17" },
    { title: "", lastName: "CANTIN", firstName: "Philippe", category: "VIP", table: "5" },
    { title: "", lastName: "CANTIN", firstName: "Philomène", category: "VIP", table: "5" },
    { title: "MME", lastName: "CHANTAL", firstName: "CACOU", category: "VIP", table: "21" },
    { title: "MME", lastName: "CISSE", firstName: "LALLAH", category: "VIP", table: "23" },
    { title: "Mr", lastName: "CISSE", firstName: "Sekou", category: "", table: "40" },
    { title: "MME", lastName: "COUCOU", firstName: "", category: "", table: "16" },
    { title: "Mr", lastName: "COULIBALY", firstName: "", category: "BNETD", table: "14" },
    { title: "Mme", lastName: "COULIBALY", firstName: "Mariam SILUE", category: "BNETD", table: "14" },
    { title: "", lastName: "COULIBALY", firstName: "Matty", category: "", table: "24" },
    { title: "", lastName: "COULIBALY", firstName: "ANIELLA", category: "", table: "27" },
    { title: "", lastName: "COULIBALY", firstName: "ABDEL", category: "", table: "27" },
    { title: "", lastName: "COULIBALY", firstName: "Habib Emmanuel", category: "GH", table: "28" },
    { title: "MR", lastName: "COULIBALY", firstName: "Souleymane", category: "", table: "37" },
    { title: "", lastName: "COULIBALY", firstName: "Simplice (conjoint SOUMALEY)", category: "VIP", table: "6" },
    { title: "MME", lastName: "DABLE", firstName: "YELLY", category: "", table: "17" },
    { title: "MME", lastName: "DABLE", firstName: "SOLLE", category: "", table: "17" },
    { title: "Mme", lastName: "DALOUMAN", firstName: "Caroline", category: "VIP", table: "2" },
    { title: "Mr", lastName: "DAMAS", firstName: "Eric", category: "", table: "40" },
    { title: "Mr", lastName: "DANHI", firstName: "Malan", category: "", table: "39" },
    { title: "Mr", lastName: "DANHI", firstName: "Tony", category: "", table: "39" },
    { title: "MR", lastName: "DAO", firstName: "PAPI", category: "", table: "31" },
    { title: "", lastName: "DAPHEE", firstName: "Joel", category: "VIP", table: "6" },
    { title: "", lastName: "DAPHEE", firstName: "Marina", category: "VIP", table: "6" },
    { title: "", lastName: "DE DIOUL", firstName: "Abdul Kader", category: "", table: "27" },
    { title: "", lastName: "DE DIOUL", firstName: "Barbara", category: "", table: "27" },
    { title: "Ambassadeur", lastName: "DIABATE", firstName: "DAOUD", category: "VIP", table: "1" },
    { title: "Mme", lastName: "DIABATE", firstName: "Cecile (AMBASSADEUR)", category: "VIP", table: "1" },
    { title: "MR", lastName: "DIABATE", firstName: "(VOISIN)", category: "", table: "19" },
    { title: "Mr", lastName: "DIABY", firstName: "Sidick", category: "", table: "39" },
    { title: "Mr", lastName: "DIACOH", firstName: "Thomas", category: "VIP VIE", table: "2" },
    { title: "Mme", lastName: "DIACOH", firstName: "Martine", category: "VIP", table: "2" },
    { title: "", lastName: "DIALLO", firstName: "Sarah", category: "", table: "24" },
    { title: "", lastName: "DIALLO", firstName: "FATIM", category: "", table: "24" },
    { title: "", lastName: "DIALLO", firstName: "RAHI DIALLO", category: "", table: "27" },
    { title: "MR", lastName: "DIALLO", firstName: "ABDOULAYE", category: "", table: "30" },
    { title: "MME", lastName: "DIALLO", firstName: "KETHIANE", category: "", table: "30" },
    { title: "MR", lastName: "DIALLO", firstName: "YACINE", category: "", table: "30" },
    { title: "MR", lastName: "DIALLO", firstName: "Belko", category: "", table: "37" },
    { title: "MR", lastName: "DIALLO", firstName: "SIDY", category: "", table: "37" },
    { title: "", lastName: "DIALLO", firstName: "Hammady", category: "", table: "37" },
    { title: "", lastName: "DIANE", firstName: "Sory", category: "GH", table: "28" },
    { title: "", lastName: "DIAWARA", firstName: "Malick", category: "", table: "29" },
    { title: "", lastName: "DIE", firstName: "AUDREY", category: "", table: "26" },
    { title: "MR", lastName: "DIENG", firstName: "Aziz", category: "", table: "30" },
    { title: "MR", lastName: "DIENY", firstName: "HERVE", category: "", table: "12" },
    { title: "MME", lastName: "DIENY", firstName: "VIVIANE", category: "", table: "12" },
    { title: "MME", lastName: "DIENY", firstName: "ARLETTE", category: "", table: "12" },
    { title: "MME", lastName: "DIENY", firstName: "MARIE MADELEINE", category: "", table: "12" },
    { title: "MR", lastName: "DIOMANDE", firstName: "DOUTY", category: "", table: "11" },
    { title: "MME", lastName: "DIOMANDE", firstName: "DOUTY", category: "", table: "11" },
    { title: "DR", lastName: "DIOMANDE", firstName: "KARIDJA", category: "", table: "20" },
    { title: "Mr", lastName: "DIOMANDE", firstName: "Moktar", category: "", table: "40" },
    { title: "MR", lastName: "DJEDJES", firstName: "HENRY", category: "", table: "33" },
    { title: "", lastName: "DJIVO", firstName: "Ted Olivier", category: "", table: "37" },
    { title: "MR", lastName: "DOHIA", firstName: "Ismael", category: "", table: "37" },
    { title: "MME", lastName: "DOHIA", firstName: "Kadiatou", category: "", table: "37" },
    { title: "MME", lastName: "DOSSO", firstName: "MAMBA", category: "", table: "26" },
    { title: "MME", lastName: "DRABE", firstName: "OLI CPV", category: "", table: "18" },
    { title: "MR", lastName: "DRAMERA", firstName: "IB", category: "", table: "31" },
    { title: "MME", lastName: "DRAMERA", firstName: "KARELLE", category: "", table: "31" },
    { title: "MME", lastName: "DROGBA", firstName: "AMI", category: "", table: "17" },
    { title: "MR", lastName: "DROGBA", firstName: "LANDRY", category: "", table: "17" },
    { title: "", lastName: "EBAGNITICHIE", firstName: "Anya", category: "", table: "36" },
    { title: "", lastName: "EBROTTIE", firstName: "Daniel", category: "GH", table: "28" },
    { title: "", lastName: "EBROTTIE", firstName: "Paulie", category: "", table: "39" },
    { title: "Mr", lastName: "ETTY", firstName: "Ekolan Alain", category: "VIP", table: "1" },
    { title: "Mme", lastName: "ETTY", firstName: "N'SOU Georgette", category: "VIP", table: "1" },
    { title: "Mr", lastName: "ETTY", firstName: "Serge", category: "VIP", table: "1" },
    { title: "Mme", lastName: "ETTY", firstName: "Clémentine", category: "VIP", table: "1" },
    { title: "Mme", lastName: "ETTY", firstName: "Evelyne", category: "VIP", table: "2" },
    { title: "Mme", lastName: "ETTY", firstName: "Eliane", category: "VIP", table: "2" },
    { title: "Mlle", lastName: "ETTY", firstName: "Tania", category: "VIP", table: "2" },
    { title: "", lastName: "ETTY", firstName: "Arthur", category: "", table: "4" },
    { title: "", lastName: "ETTY", firstName: "Carolanne", category: "", table: "4" },
    { title: "", lastName: "ETTY", firstName: "Louis-Joseph", category: "", table: "4" },
    { title: "", lastName: "ETTY", firstName: "Auriane", category: "", table: "4" },
    { title: "", lastName: "ETTY", firstName: "Louna", category: "", table: "4" },
    { title: "Mr", lastName: "ETTY", firstName: "Claude", category: "VIP", table: "5" },
    { title: "Mme", lastName: "ETTY", firstName: "Isabelle", category: "VIP", table: "5" },
    { title: "Mme", lastName: "ETTY", firstName: "Marthe", category: "VIP", table: "6" },
    { title: "Mr", lastName: "ETTY", firstName: "Thomas", category: "", table: "7" },
    { title: "Mme", lastName: "ETTY", firstName: "Farah", category: "", table: "7" },
    { title: "Mr", lastName: "ETTY", firstName: "Yves Antoine", category: "", table: "7" },
    { title: "MR", lastName: "ETTY", firstName: "Stephane", category: "", table: "13" },
    { title: "Mme", lastName: "ETTY", firstName: "Stephanie", category: "", table: "13" },
    { title: "Mme", lastName: "ETTY", firstName: "Emmanuela", category: "", table: "13" },
    { title: "Mr", lastName: "ETTY", firstName: "Yves Alain", category: "", table: "13" },
    { title: "Mme", lastName: "ETTY", firstName: "Cynthia", category: "", table: "13" },
    { title: "Mr", lastName: "ETTY", firstName: "Guy Daniel", category: "", table: "13" },
    { title: "Mme", lastName: "ETTY", firstName: "Charlotte (Guy Daniel)", category: "", table: "13" },
    { title: "", lastName: "ETTY", firstName: "Christian", category: "", table: "29" },
    { title: "MME", lastName: "FALL", firstName: "PHACIE CATLEYAS", category: "", table: "20" },
    { title: "MR", lastName: "FAMIEH", firstName: "JUSTINE", category: "", table: "12" },
    { title: "MME", lastName: "FOFANA", firstName: "AICHA", category: "DH", table: "28" },
    { title: "MME", lastName: "FOFANA", firstName: "CEDYA", category: "DH", table: "28" },
    { title: "DR", lastName: "FOKOU", firstName: "HERVE", category: "", table: "20" },
    { title: "MR", lastName: "FREDERIC", firstName: "", category: "", table: "16" },
    { title: "Mr", lastName: "GATI", firstName: "Blaise", category: "", table: "10" },
    { title: "MR", lastName: "GBAKOUI", firstName: "PATERNE", category: "", table: "19" },
    { title: "MME", lastName: "GBAKOUI", firstName: "PATERNE", category: "", table: "19" },
    { title: "MR", lastName: "GBATE", firstName: "", category: "", table: "12" },
    { title: "", lastName: "GENDRON", firstName: "Mathieu", category: "", table: "4" },
    { title: "", lastName: "GENDRON", firstName: "Marie-Christine", category: "", table: "4" },
    { title: "MR", lastName: "GLAOU", firstName: "YANN CEDRIC", category: "", table: "15" },
    { title: "", lastName: "GLAOU", firstName: "LOUENA", category: "", table: "15" },
    { title: "Mme", lastName: "GNAGNE", firstName: "Allico", category: "BNETD", table: "14" },
    { title: "MR", lastName: "GOLI", firstName: "", category: "VIP", table: "22" },
    { title: "MME", lastName: "GOLI", firstName: "", category: "VIP", table: "22" },
    { title: "MR", lastName: "GOLY", firstName: "ABOH MARIE", category: "", table: "17" },
    { title: "", lastName: "GONCALVES", firstName: "Juliette", category: "", table: "4" },
    { title: "MR", lastName: "GOUARA", firstName: "LASSOU JUNIOR", category: "", table: "27" },
    { title: "MR", lastName: "HAMA", firstName: "DAO", category: "VIP", table: "21" },
    { title: "MME", lastName: "HAMA", firstName: "DAO", category: "VIP", table: "21" },
    { title: "MME", lastName: "HAWA", firstName: "AW", category: "", table: "30" },
    { title: "MR", lastName: "HOVING", firstName: "(VOISIN)", category: "", table: "19" },
    { title: "MME", lastName: "HOVING", firstName: "(VOISIN)", category: "", table: "19" },
    { title: "Mme", lastName: "JOSEPH", firstName: "Olga", category: "VIP", table: "3" },
    { title: "Mme", lastName: "JOSEPH", firstName: "Nicole", category: "VIP", table: "3" },
    { title: "MME", lastName: "JOSIANE", firstName: "KOUDOU", category: "VIP", table: "22" },
    { title: "MME", lastName: "JULIE", firstName: "PHACIE CATLEYAS", category: "", table: "20" },
    { title: "", lastName: "KABRAN", firstName: "Norris", category: "", table: "32" },
    { title: "", lastName: "KABRAN", firstName: "Bintou", category: "", table: "32" },
    { title: "MR", lastName: "KABRAN", firstName: "Kevin", category: "", table: "37" },
    { title: "Mme", lastName: "KACOU", firstName: "Denise", category: "VIP", table: "3" },
    { title: "", lastName: "KAHOUNOU", firstName: "Claude Yvan", category: "", table: "36" },
    { title: "MR", lastName: "KAMBOU", firstName: "RODRIGUE", category: "", table: "30" },
    { title: "", lastName: "KANGAH", firstName: "YANN", category: "", table: "27" },
    { title: "", lastName: "KANGAH", firstName: "OLIVIA", category: "", table: "27" },
    { title: "Mlle", lastName: "KANTE", firstName: "Yasmine", category: "", table: "35" },
    { title: "Mr", lastName: "KANTE", firstName: "Ousmane", category: "", table: "39" },
    { title: "", lastName: "KASSI", firstName: "Amy KASSI", category: "VIP", table: "9" },
    { title: "", lastName: "KEOU", firstName: "AUDREY", category: "", table: "26" },
    { title: "DR", lastName: "KESSE", firstName: "RITA (TOGO)", category: "", table: "27" },
    { title: "", lastName: "KESSE", firstName: "ISAAC", category: "", table: "27" },
    { title: "Mr", lastName: "KESSIE", firstName: "Stephane", category: "", table: "39" },
    { title: "Mr", lastName: "KOFFI", firstName: "Konian", category: "VIP", table: "1" },
    { title: "", lastName: "KOFFI", firstName: "Marie Aimée", category: "VIP", table: "6" },
    { title: "MME", lastName: "KOFFI", firstName: "MARYLINE", category: "", table: "16" },
    { title: "", lastName: "KOFFI", firstName: "Tara", category: "", table: "29" },
    { title: "", lastName: "KOFFI", firstName: "Joel", category: "", table: "29" },
    { title: "", lastName: "KOFFI", firstName: "Shariza", category: "", table: "29" },
    { title: "Mr", lastName: "KOFFI", firstName: "Lino", category: "", table: "39" },
    { title: "Mr", lastName: "KOFFI", firstName: "Wilfried", category: "", table: "39" },
    { title: "Mme", lastName: "KOISSY", firstName: "Emmanuel Koissy", category: "", table: "10" },
    { title: "Mme", lastName: "KOISSY", firstName: "Ginette Koissy", category: "", table: "10" },
    { title: "Mme", lastName: "KOISSY", firstName: "Melanie koissy", category: "", table: "10" },
    { title: "Mme", lastName: "KOISSY", firstName: "Rita Koissy", category: "", table: "10" },
    { title: "Mme", lastName: "KOISSY", firstName: "Agnes Koissy", category: "", table: "10" },
    { title: "MME", lastName: "KOIZAN", firstName: "MIREILLE", category: "VIP", table: "22" },
    { title: "MME", lastName: "KOIZAN", firstName: "Lydia", category: "", table: "35" },
    { title: "", lastName: "KONAN", firstName: "Vanessa", category: "", table: "37" },
    { title: "MME", lastName: "KONE", firstName: "LEGNON", category: "VIP", table: "22" },
    { title: "MR", lastName: "KONE", firstName: "RODRIGUE", category: "VIP", table: "22" },
    { title: "", lastName: "KONE", firstName: "Doneci", category: "", table: "32" },
    { title: "MR", lastName: "KONE", firstName: "ALASSANE", category: "", table: "33" },
    { title: "", lastName: "KONE", firstName: "RONNIE", category: "", table: "33" },
    { title: "Mr", lastName: "KONE", firstName: "Moukila", category: "", table: "40" },
    { title: "MME", lastName: "KONIN", firstName: "ANGE AURELIE", category: "", table: "26" },
    { title: "MME", lastName: "KOPOIN", firstName: "Vanessa", category: "", table: "17" },
    { title: "Mme", lastName: "KOPOIN", firstName: "Hortense", category: "", table: "10" },
    { title: "Mme", lastName: "KOPOIN", firstName: "Virginie Kopoin", category: "", table: "10" },
    { title: "Mme", lastName: "KOPOIN", firstName: "Olivia", category: "", table: "10" },
    { title: "Mile", lastName: "KOPOIN", firstName: "Philomène", category: "", table: "17" },
    { title: "", lastName: "KOREKI", firstName: "Solange", category: "VIP", table: "6" },
    { title: "DR", lastName: "KOSSERE", firstName: "", category: "", table: "20" },
    { title: "", lastName: "KOUACOU", firstName: "Alec Désiré", category: "", table: "39" },
    { title: "", lastName: "KOUADIO", firstName: "Roland Marcel", category: "GH", table: "28" },
    { title: "", lastName: "KOUADIO", firstName: "Helena", category: "", table: "36" },
    { title: "Mr", lastName: "KOUADIO", firstName: "Lefty", category: "", table: "39" },
    { title: "Mr", lastName: "KOUAKOU", firstName: "Nanan KOUAKOU", category: "VIP", table: "2" },
    { title: "Mme", lastName: "KOUAKOU", firstName: "Yvonne", category: "VIP", table: "2" },
    { title: "MME", lastName: "KOUAKOU", firstName: "MARIE THÉRÈSE REMI", category: "VIP", table: "23" },
    { title: "MME", lastName: "KOUAME", firstName: "CARLINE", category: "", table: "24" },
    { title: "MR", lastName: "KOUAME", firstName: "YEDI", category: "", table: "33" },
    { title: "Mr", lastName: "KOUAME", firstName: "Yann Cedric", category: "", table: "39" },
    { title: "MR", lastName: "KOUAO", firstName: "INNOCENT", category: "VIP", table: "23" },
    { title: "MME", lastName: "KOUAO", firstName: "JEANNE LAURE", category: "VIP", table: "23" },
    { title: "Mr", lastName: "KOUASSI", firstName: "Jacques", category: "", table: "7" },
    { title: "Mme", lastName: "KOUASSI", firstName: "Myria", category: "", table: "7" },
    { title: "Mme", lastName: "KOUASSI", firstName: "Solange", category: "", table: "10" },
    { title: "MME", lastName: "KOUASSI", firstName: "Pauline", category: "", table: "12" },
    { title: "", lastName: "KOUASSI", firstName: "Fabrice Désiré", category: "GH", table: "28" },
    { title: "Mr", lastName: "KOUASSI", firstName: "Paul Henry", category: "", table: "40" },
    { title: "MR", lastName: "KOUDOU", firstName: "JEAN MARIE", category: "", table: "8" },
    { title: "MME", lastName: "KOUDOU", firstName: "JEAN MARIE", category: "", table: "8" },
    { title: "MR", lastName: "KOUDOU", firstName: "JEAN CHARLES", category: "", table: "19" },
    { title: "MME", lastName: "KOULIBALY", firstName: "LIMATA", category: "VIP", table: "23" },
    { title: "Mr", lastName: "KOUMAN", firstName: "Valery", category: "BNETD", table: "14" },
    { title: "Mr", lastName: "KOUTOUAN", firstName: "Lobassé", category: "BNETD", table: "14" },
    { title: "", lastName: "KOUYATE", firstName: "Cheick", category: "", table: "32" },
    { title: "", lastName: "KOUYATE", firstName: "Rokia", category: "", table: "32" },
    { title: "MR", lastName: "KREMIEN", firstName: "KARL-AUGUSTE", category: "", table: "31" },
    { title: "", lastName: "LASMEL", firstName: "LASMEL", category: "", table: "34" },
    { title: "MR", lastName: "LERO", firstName: "ARNAUD", category: "", table: "16" },
    { title: "", lastName: "LIKIKOUET", firstName: "KYLIANE", category: "", table: "15" },
    { title: "MME", lastName: "LIKIKOUET", firstName: "ODETTE SAUYET", category: "VIP", table: "22" },
    { title: "Mme", lastName: "LOBA", firstName: "Pierre", category: "", table: "10" },
    { title: "", lastName: "LOGON", firstName: "LUCE", category: "", table: "15" },
    { title: "MME", lastName: "LOGON", firstName: "ROSALIE", category: "VIP", table: "23" },
    { title: "MR", lastName: "LOGON", firstName: "JOSEPH", category: "VIP", table: "23" },
    { title: "MR", lastName: "LOGON", firstName: "KEVIN", category: "", table: "31" },
    { title: "", lastName: "LOKONDO", firstName: "CASSY", category: "DH", table: "28" },
    { title: "Mr", lastName: "LOSSO", firstName: "Bi Irié", category: "BNETD", table: "14" },
    { title: "MME", lastName: "MADY", firstName: "BELINDA", category: "", table: "17" },
    { title: "", lastName: "MARIE", firstName: "DR CACOU PIERRE MARIE", category: "VIP", table: "21" },
    { title: "", lastName: "MARQUEZ", firstName: "SEPHORA", category: "", table: "32" },
    { title: "MME", lastName: "MBEMBA", firstName: "NICOLE", category: "", table: "12" },
    { title: "MR", lastName: "MBEMBA", firstName: "KARL", category: "", table: "30" },
    { title: "MME", lastName: "MESSOU", firstName: "MARIE EMMANUELLE", category: "", table: "31" },
    { title: "MR", lastName: "MESSOU", firstName: "JOSEPH", category: "", table: "31" },
    { title: "MR", lastName: "MESSOU", firstName: "CEDRIC", category: "", table: "33" },
    { title: "MME", lastName: "MESSOU", firstName: "SEYNABOU", category: "", table: "33" },
    { title: "MME", lastName: "MICHOU", firstName: "", category: "VIP", table: "25" },
    { title: "MME", lastName: "MONIQUE", firstName: "", category: "VIP", table: "21" },
    { title: "", lastName: "MOULOT", firstName: "Maguy", category: "", table: "4" },
    { title: "MME", lastName: "NADEGE", firstName: "CPV", category: "", table: "18" },
    { title: "", lastName: "N'DEYE", firstName: "MADELEINE", category: "DH", table: "28" },
    { title: "Mr", lastName: "N'DIR", firstName: "Moustapha", category: "", table: "40" },
    { title: "MME", lastName: "N'DOUMY", firstName: "DIESSIRA", category: "VIP", table: "25" },
    { title: "MR", lastName: "N'DOUMY", firstName: "ROGER", category: "VIP", table: "25" },
    { title: "", lastName: "N'DOUMY", firstName: "EYOLI", category: "", table: "34" },
    { title: "", lastName: "N'DOUMY", firstName: "JESSICA", category: "", table: "34" },
    { title: "", lastName: "N'DOUMY", firstName: "RHODIA", category: "", table: "34" },
    { title: "", lastName: "N'DOUMY", firstName: "N'DOUMY ESSONNIE", category: "", table: "26" },
    { title: "Mme", lastName: "N'DRI", firstName: "Mathey", category: "VIP", table: "5" },
    { title: "", lastName: "N'DRI", firstName: "Suzette N'DRI", category: "", table: "24" },
    { title: "MME", lastName: "N'GORAN", firstName: "NADEGE PHACIE CATLEYAS", category: "", table: "20" },
    { title: "Mr", lastName: "N'GORAN", firstName: "Arnold", category: "", table: "38" },
    { title: "Mme", lastName: "N'GORAN", firstName: "Dielica", category: "", table: "38" },
    { title: "MME", lastName: "NGOUIN", firstName: "CLAIH ANNE AUDREY", category: "", table: "24" },
    { title: "Mr", lastName: "N'GUESSAN", firstName: "Brice", category: "", table: "7" },
    { title: "Mme", lastName: "N'GUESSAN", firstName: "Amandine", category: "", table: "7" },
    { title: "DR", lastName: "NIAMKE", firstName: "", category: "", table: "20" },
    { title: "", lastName: "NIAMKEY", firstName: "Guy", category: "", table: "4" },
    { title: "", lastName: "NIANGADOU", firstName: "Aminata", category: "", table: "24" },
    { title: "MME", lastName: "NOELLE", firstName: "DJEDJE", category: "VIP", table: "25" },
    { title: "Mr", lastName: "N'ZI", firstName: "Rémy", category: "VIP", table: "5" },
    { title: "Mme", lastName: "N'ZI", firstName: "Rémy", category: "VIP", table: "5" },
    { title: "MR", lastName: "N'ZI", firstName: "Remy Marcel N'ZI", category: "", table: "35" },
    { title: "MR", lastName: "N'ZI", firstName: "Franck N'ZI", category: "", table: "35" },
    { title: "", lastName: "ODKANZI", firstName: "MURIELLE", category: "DH", table: "28" },
    { title: "MME", lastName: "OKRE", firstName: "ALIDA CPV", category: "", table: "18" },
    { title: "MME", lastName: "OLGA", firstName: "", category: "", table: "8" },
    { title: "MR", lastName: "ORO", firstName: "ADAM", category: "", table: "16" },
    { title: "MR", lastName: "ORO", firstName: "OLIVIER", category: "", table: "16" },
    { title: "MR", lastName: "ORO", firstName: "ANDERSON", category: "", table: "16" },
    { title: "MR", lastName: "QUANGRE", firstName: "Habib", category: "", table: "37" },
    { title: "MR", lastName: "QUATTARA", firstName: "(VOISIN)", category: "", table: "19" },
    { title: "MME", lastName: "QUATTARA", firstName: "(VOISIN)", category: "", table: "19" },
    { title: "", lastName: "QUATTARA", firstName: "DONIA", category: "", table: "26" },
    { title: "MR", lastName: "PAMAH", firstName: "DOMINIQUE", category: "", table: "19" },
    { title: "Mr", lastName: "PAUL", firstName: "Niamkey", category: "VIP", table: "3" },
    { title: "Mme", lastName: "PAUL", firstName: "Niamkey", category: "VIP", table: "3" },
    { title: "MME", lastName: "PAUL", firstName: "MARCELLE", category: "", table: "16" },
    { title: "Mme", lastName: "PITAH", firstName: "Antoinette", category: "VIP", table: "9" },
    { title: "Mr", lastName: "PITAH", firstName: "(conjoint Antoinette)", category: "VIP", table: "9" },
    { title: "", lastName: "PITAH", firstName: "Marlene", category: "", table: "36" },
    { title: "Mr", lastName: "PORQUET", firstName: "Jeannot", category: "VIP", table: "3" },
    { title: "MR", lastName: "PORQUET", firstName: "Hervé", category: "", table: "35" },
    { title: "", lastName: "RICHMOND", firstName: "Hubert", category: "VIP", table: "6" },
    { title: "", lastName: "RICHMOND", firstName: "Odile", category: "VIP", table: "6" },
    { title: "", lastName: "RICHMOND", firstName: "Cécile", category: "VIP", table: "6" },
    { title: "Mr", lastName: "SAFER", firstName: "Fouad (DETI)", category: "VIP", table: "23" },
    { title: "", lastName: "SAHOUET", firstName: "YANNICK", category: "", table: "34" },
    { title: "", lastName: "SAHOUET", firstName: "GERMINA", category: "", table: "34" },
    { title: "MME", lastName: "SANGA", firstName: "INES", category: "", table: "24" },
    { title: "", lastName: "SANGARE", firstName: "Balla", category: "", table: "39" },
    { title: "", lastName: "SARR", firstName: "LISA", category: "", table: "34" },
    { title: "", lastName: "SARR", firstName: "RACHID", category: "", table: "34" },
    { title: "MME", lastName: "SEHIA", firstName: "MARIE PASCALE", category: "", table: "17" },
    { title: "MR", lastName: "SEHIA", firstName: "AUGUSTIN", category: "VIP", table: "22" },
    { title: "MME", lastName: "SEHIA", firstName: "PAULINE", category: "VIP", table: "22" },
    { title: "MR", lastName: "SEKA", firstName: "HANS REGIS", category: "", table: "30" },
    { title: "MR", lastName: "SEKA", firstName: "FATIMA", category: "", table: "30" },
    { title: "MR", lastName: "SERGES", firstName: "KOFFI", category: "", table: "17" },
    { title: "Mme", lastName: "SERY", firstName: "Charlotte", category: "", table: "8" },
    { title: "", lastName: "SERY", firstName: "LAGUI AIME", category: "", table: "8" },
    { title: "", lastName: "SERY", firstName: "KETTY", category: "", table: "28" },
    { title: "MME", lastName: "SERY", firstName: "ANNE MARIE", category: "", table: "8" },
    { title: "MME", lastName: "SERY", firstName: "MARTHE", category: "", table: "8" },
    { title: "MME", lastName: "SERY", firstName: "THIERRY", category: "", table: "8" },
    { title: "MME", lastName: "SERY", firstName: "PASCALE", category: "", table: "8" },
    { title: "MR", lastName: "SERY", firstName: "EPHREM", category: "", table: "11" },
    { title: "MME", lastName: "SERY", firstName: "VIOLETTE", category: "", table: "11" },
    { title: "MR", lastName: "SERY", firstName: "PAUL", category: "", table: "16" },
    { title: "MR", lastName: "SERY", firstName: "DIDIER", category: "", table: "19" },
    { title: "MME", lastName: "SERY", firstName: "DIDIER", category: "", table: "19" },
    { title: "MR", lastName: "SERY", firstName: "KOUDOU BASILE", category: "VIP", table: "21" },
    { title: "DR", lastName: "SERY", firstName: "FATOUMATA", category: "VIP", table: "21" },
    { title: "MR", lastName: "SERY", firstName: "PATRICE", category: "VIP", table: "22" },
    { title: "MME", lastName: "SERY", firstName: "MATILDE", category: "VIP", table: "22" },
    { title: "", lastName: "SERY", firstName: "BENNIE", category: "", table: "26" },
    { title: "MR", lastName: "SERY", firstName: "THIERRY", category: "", table: "8" },
    { title: "", lastName: "SIA", firstName: "Hans", category: "", table: "39" },
    { title: "MR", lastName: "SIBAILLY", firstName: "YOANE", category: "", table: "30" },
    { title: "MME", lastName: "SIBAILLY", firstName: "YACINE", category: "", table: "30" },
    { title: "Mr", lastName: "SISSOKO", firstName: "Ben Kader", category: "", table: "38" },
    { title: "", lastName: "SOGROU", firstName: "Wilfried", category: "GH", table: "28" },
    { title: "Mr", lastName: "SOGROU", firstName: "Alexandre", category: "", table: "33" },
    { title: "Mr", lastName: "SORHO", firstName: "Patrick", category: "", table: "39" },
    { title: "MR", lastName: "SOUKOU", firstName: "DIDIER", category: "VIP", table: "25" },
    { title: "MME", lastName: "SOUKOU", firstName: "IDA", category: "VIP", table: "25" },
    { title: "", lastName: "SOULEYMΑΝΑ", firstName: "JIM TOGO", category: "", table: "28" },
    { title: "", lastName: "SOUMALEY", firstName: "Béatrice", category: "VIP", table: "6" },
    { title: "MR", lastName: "SYLLA", firstName: "LASSINA", category: "VIP", table: "21" },
    { title: "", lastName: "SYLLA", firstName: "SAFY", category: "", table: "27" },
    { title: "Mr", lastName: "TAGRO", firstName: "Kader", category: "", table: "38" },
    { title: "Mr", lastName: "TAGRO", firstName: "Goba", category: "", table: "38" },
    { title: "Mr", lastName: "TAGRO", firstName: "Mahé", category: "", table: "38" },
    { title: "Mr", lastName: "TAGRO", firstName: "Zika", category: "", table: "38" },
    { title: "Mr", lastName: "TAPE", firstName: "Magloir", category: "", table: "40" },
    { title: "", lastName: "TATA", firstName: "BEA", category: "", table: "29" },
    { title: "", lastName: "TCHACHOTE", firstName: "JOY", category: "", table: "26" },
    { title: "", lastName: "TENE", firstName: "Sory", category: "", table: "39" },
    { title: "", lastName: "THIAM", firstName: "YIGO", category: "VIP", table: "5" },
    { title: "Mme", lastName: "THIAM", firstName: "Dominique", category: "VIP", table: "5" },
    { title: "", lastName: "TIACOH", firstName: "CELLI", category: "", table: "15" },
    { title: "MR", lastName: "TIACOH", firstName: "ELIE THOMAS", category: "", table: "15" },
    { title: "Mr", lastName: "TIAPANI", firstName: "Jean Phillipe", category: "", table: "40" },
    { title: "MME", lastName: "TIBE", firstName: "SARAH", category: "", table: "24" },
    { title: "MME", lastName: "TIENDREBEGO", firstName: "LINDA CPV", category: "", table: "18" },
    { title: "Mme", lastName: "Tobin-Porquet", firstName: "Monique", category: "VIP", table: "3" },
    { title: "Mme", lastName: "TOTO", firstName: "Nicole", category: "VIP", table: "6" },
    { title: "Mme", lastName: "TRAORE", firstName: "Malika", category: "", table: "4" },
    { title: "Mr", lastName: "TRAORE", firstName: "Tresor", category: "", table: "40" },
    { title: "Mme", lastName: "TRAORE", firstName: "Mado", category: "", table: "40" },
    { title: "MME", lastName: "VANESSA", firstName: "", category: "", table: "16" },
    { title: "", lastName: "VANY", firstName: "MARIE MICHELLE", category: "", table: "8" },
    { title: "MME", lastName: "VANY", firstName: "DOMINIQUE", category: "", table: "8" },
    { title: "MR", lastName: "VANY", firstName: "DOMINIQUE", category: "", table: "8" },
    { title: "MME", lastName: "VANY", firstName: "CHANTAL", category: "", table: "8" },
    { title: "MR", lastName: "VANY", firstName: "JEAN CYRILLE", category: "", table: "8" },
    { title: "MME", lastName: "VANY", firstName: "JEAN CYRILLE", category: "", table: "8" },
    { title: "MR", lastName: "VANY", firstName: "HERMANN", category: "", table: "8" },
    { title: "MME", lastName: "VANY", firstName: "FLORE", category: "", table: "8" },
    { title: "Mme", lastName: "VICENS", firstName: "Suzie", category: "VIP", table: "3" },
    { title: "", lastName: "VICENS", firstName: "Fabrice", category: "", table: "7" },
    { title: "", lastName: "VONOR", firstName: "ORNELLA TOGO", category: "", table: "28" },
    { title: "Mr", lastName: "WODIE", firstName: "Francis Jr (Dr)", category: "", table: "7" },
    { title: "MR", lastName: "Wodie", firstName: "Francis Jr (Dr)", category: "", table: "30" },
    { title: "", lastName: "YA", firstName: "Arnold", category: "", table: "32" },
    { title: "", lastName: "YA", firstName: "Alvin", category: "", table: "39" },
    { title: "", lastName: "YA", firstName: "Noura", category: "", table: "39" },
    { title: "Mme", lastName: "YANGNI", firstName: "Antoinette", category: "VIP", table: "2" },
    { title: "Mr", lastName: "YANGNI ANGATE", firstName: "Sylvain", category: "VIP", table: "2" },
    { title: "Mme", lastName: "YANGNI ANGATE", firstName: "Sylvain", category: "VIP", table: "2" },
    { title: "MME", lastName: "YAO", firstName: "ALIZE", category: "", table: "24" },
    { title: "MME", lastName: "YAPI", firstName: "KARELLE", category: "", table: "12" },
    { title: "", lastName: "YAPI", firstName: "Steven", category: "", table: "39" },
    { title: "MME", lastName: "YAYI", firstName: "AMANDA", category: "DH", table: "28" },
    { title: "MR", lastName: "YEO", firstName: "PHILIP", category: "", table: "11" },
    { title: "MME", lastName: "YEO", firstName: "GRACE", category: "", table: "11" },
    { title: "MME", lastName: "ZAHOUI", firstName: "Delphine", category: "", table: "12" },
    { title: "MR", lastName: "ZAHOUI", firstName: "MOISE", category: "", table: "17" },
    { title: "", lastName: "ZEGOUA", firstName: "Manuela", category: "", table: "36" },
    { title: "MR", lastName: "ZEPHIRIN", firstName: "", category: "VIP", table: "22" },
    { title: "MME", lastName: "ZEPHIRIN", firstName: "", category: "VIP", table: "22" },
    { title: "", lastName: "ZIAZIE", firstName: "Paul", category: "", table: "13" },
    { title: "MME", lastName: "ZOUO", firstName: "EDWIGE TOMPIEU", category: "", table: "11" },
    { title: "MME", lastName: "ZOZORO", firstName: "NADEGE", category: "", table: "17" }
];

// --- Helper Components ---
const StatCard = ({ icon, value, label, colorClass, loading }) => (
    <div className="flex-1 p-4 md:p-5 bg-gray-800/50 border border-white/10 rounded-xl flex items-center shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-gray-800/80 hover:border-white/20">
        <div className={`mr-4 p-3 rounded-lg ${colorClass} bg-opacity-20 text-white`}>
            {icon}
        </div>
        <div className="flex flex-col">
            {loading ? (
                 <div className="h-8 w-16 bg-gray-600/50 rounded-md animate-pulse"></div>
            ) : (
                 <span className="text-3xl font-bold text-white">{value}</span>
            )}
            <span className="text-sm text-gray-300 uppercase tracking-wider">{label}</span>
        </div>
    </div>
);

const GuestRow = ({ guest, onUpdateStatus, isUpdating }) => {
    const isVip = guest.category && guest.category.toUpperCase().includes('VIP');
    const isArrived = guest.status === 'Arrivé';

    return (
        <div className={`
            flex flex-col sm:flex-row items-start sm:items-center p-4 rounded-lg transition-all duration-300
            ${isArrived ? 'bg-emerald-900/30' : 'bg-gray-800/60 hover:bg-gray-700/60'}
            border-l-4 ${isArrived ? 'border-emerald-500' : (isVip ? 'border-amber-400' : 'border-gray-700')}
        `}>
            <div className="flex-1 flex items-center pr-4 mb-3 sm:mb-0">
                {isVip && <Crown className="w-5 h-5 text-amber-400 mr-3 flex-shrink-0" />}
                <div>
                    <p className="font-semibold text-white text-lg">
                        {guest.title} {guest.lastName} {guest.firstName}
                    </p>
                    <p className="text-sm text-gray-400">
                        Table: <span className="font-bold text-gray-200">{guest.table || 'N/A'}</span>
                        {guest.category && <span className="ml-2 pl-2 border-l border-gray-600">{guest.category}</span>}
                    </p>
                </div>
            </div>
            <div className="flex items-center w-full sm:w-auto">
                {isArrived ? (
                    <button
                        onClick={() => onUpdateStatus(guest.id, 'En attente')}
                        disabled={isUpdating}
                        className="
                            w-full sm:w-auto px-4 py-2 bg-yellow-600/80 text-white font-semibold rounded-lg 
                            hover:bg-yellow-500/80 transition-all duration-200
                            disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2
                        "
                    >
                        <Undo2 size={16} />
                        {isUpdating ? '...' : 'Annuler'}
                    </button>
                ) : (
                    <button
                        onClick={() => onUpdateStatus(guest.id, 'Arrivé')}
                        disabled={isUpdating}
                        className="
                            w-full sm:w-auto px-4 py-2 bg-emerald-600 text-white font-semibold rounded-lg 
                            hover:bg-emerald-500 transition-all duration-200
                            disabled:bg-gray-500 disabled:cursor-not-allowed flex items-center justify-center gap-2
                            shadow-lg shadow-emerald-500/20
                        "
                    >
                        <CheckCircle size={16} />
                        {isUpdating ? '...' : 'Enregistrer'}
                    </button>
                )}
            </div>
        </div>
    );
};

// --- Main App Component ---
export default function App() {
    // Firebase state
    const [db, setDb] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);

    // App state
    const [guests, setGuests] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('Tous'); // 'Tous', 'En attente', 'Arrivé'
    const [isLoading, setIsLoading] = useState(true);
    const [isInitializing, setIsInitializing] = useState(false);
    const [updatingGuestId, setUpdatingGuestId] = useState(null);

    // One-time Firebase initialization and authentication
    useEffect(() => {
        try {
            if (firebaseConfig.apiKey) {
                const app = initializeApp(firebaseConfig);
                const firestore = getFirestore(app);
                const authInstance = getAuth(app);
                setDb(firestore);
                setLogLevel('error');

                const unsubscribe = onAuthStateChanged(authInstance, async (user) => {
                    if (!user) {
                        try {
                            await signInAnonymously(authInstance);
                        } catch (error) {
                            console.error("Error signing in anonymously:", error);
                        }
                    }
                    setIsAuthReady(true);
                });
                return () => unsubscribe();
            } else {
                 console.error("Firebase config is missing. Check your .env file or Netlify environment variables.");
                 setIsLoading(false);
            }
        } catch (error) {
            console.error("Firebase initialization error:", error);
            setIsLoading(false);
        }
    }, []);

    // Firestore data synchronization
    useEffect(() => {
        if (!isAuthReady || !db) return;

        const guestsCollectionRef = collection(db, 'artifacts', appId, 'public', 'data', 'guests');

        const unsubscribe = onSnapshot(guestsCollectionRef, 
            (snapshot) => {
                if (snapshot.empty && !isInitializing) {
                    const initializeData = async () => {
                        setIsInitializing(true);
                        console.log("No data found. Initializing guest list...");
                        const batch = writeBatch(db);
                        initialGuestData.forEach(guest => {
                            const docRef = doc(guestsCollectionRef);
                            batch.set(docRef, { ...guest, status: 'En attente' });
                        });
                        await batch.commit();
                        console.log("Guest list initialized.");
                        setIsInitializing(false);
                    };
                    initializeData().catch(console.error);
                } else {
                    const guestList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setGuests(guestList);
                }
                setIsLoading(false);
            },
            (error) => {
                console.error("Error fetching guests:", error);
                setIsLoading(false);
            }
        );

        return () => unsubscribe();

    }, [isAuthReady, db, isInitializing]);

    // Memoized values for performance
    const dashboardStats = useMemo(() => {
        const arrivedCount = guests.filter(g => g.status === 'Arrivé').length;
        const vipCount = guests.filter(g => g.category && g.category.toUpperCase().includes('VIP')).length;
        return {
            total: guests.length,
            arrived: arrivedCount,
            pending: guests.length - arrivedCount,
            vips: vipCount,
        };
    }, [guests]);

    const filteredGuests = useMemo(() => {
        return guests
            .filter(guest => {
                if (filterStatus === 'Tous') return true;
                return guest.status === filterStatus;
            })
            .filter(guest => {
                const fullName = `${guest.title || ''} ${guest.firstName || ''} ${guest.lastName || ''}`.toLowerCase();
                return fullName.includes(searchTerm.toLowerCase());
            })
            .sort((a, b) => {
                // Primary sort by last name
                const lastNameComparison = (a.lastName || '').localeCompare(b.lastName || '');
                if (lastNameComparison !== 0) {
                    return lastNameComparison;
                }
                // Secondary sort by first name if last names are the same
                return (a.firstName || '').localeCompare(b.firstName || '');
            });
    }, [guests, searchTerm, filterStatus]);

    // Handler to update a guest's status (check-in or undo)
    const handleUpdateStatus = async (guestId, newStatus) => {
        if (!db) return;
        setUpdatingGuestId(guestId);
        try {
            const guestRef = doc(db, 'artifacts', appId, 'public', 'data', 'guests', guestId);
            await updateDoc(guestRef, { status: newStatus });
        } catch (error) {
            console.error("Error updating guest status:", error);
        } finally {
            setUpdatingGuestId(null);
        }
    };

    return (
        <div className="min-h-screen w-full bg-gray-900 text-white font-sans bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(16,185,129,0.3),rgba(255,255,255,0))]">
            <div className="container mx-auto p-4 sm:p-6 md:p-8">

                <header className="text-center mb-10">
                    <p className="text-lg text-amber-300">Mariage de</p>
                    <h1 className="text-4xl md:text-5xl font-bold text-white tracking-wide">
                        Roxane & Chris Emmanuel
                    </h1>
                    <div className="mt-4 h-0.5 w-24 bg-gradient-to-r from-amber-400 to-emerald-400 mx-auto"></div>
                </header>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-8">
                    <StatCard icon={<Users size={24} />} value={dashboardStats.total} label="Invités" colorClass="border-blue-400" loading={isLoading} />
                    <StatCard icon={<LogIn size={24} />} value={dashboardStats.arrived} label="Arrivés" colorClass="border-green-400" loading={isLoading} />
                    <StatCard icon={<Clock size={24} />} value={dashboardStats.pending} label="En Attente" colorClass="border-orange-400" loading={isLoading} />
                    <StatCard icon={<Crown size={24} />} value={dashboardStats.vips} label="VIPs" colorClass="border-amber-400" loading={isLoading} />
                </div>

                <div className="p-4 bg-black/20 rounded-xl mb-6 backdrop-blur-sm border border-white/10 sticky top-4 z-10">
                    <div className="flex flex-col md:flex-row gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Rechercher par nom, prénom..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-gray-800/80 border border-gray-700 rounded-lg py-3 pl-12 pr-4 focus:ring-2 focus:ring-emerald-400 focus:outline-none transition-all duration-200 placeholder-gray-500"
                            />
                        </div>
                        <div className="flex items-center justify-center bg-gray-800/80 border border-gray-700 rounded-lg p-1">
                            {['Tous', 'En attente', 'Arrivé'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => setFilterStatus(status)}
                                    className={`
                                        px-4 py-2 rounded-md text-sm font-semibold transition-all duration-200 w-full md:w-auto
                                        ${filterStatus === status ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-300 hover:bg-gray-700/50'}
                                    `}
                                >
                                    {status}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <main>
                    {isLoading || isInitializing ? (
                        <div className="text-center py-10">
                            <div role="status" className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-solid border-emerald-400 border-r-transparent motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
                            <p className="mt-4 text-gray-300">{isInitializing ? "Initialisation de la liste d'invités..." : "Chargement des données..."}</p>
                        </div>
                    ) : filteredGuests.length > 0 ? (
                        <div className="space-y-3">
                            {filteredGuests.map(guest => (
                                <GuestRow 
                                    key={guest.id} 
                                    guest={guest} 
                                    onUpdateStatus={handleUpdateStatus}
                                    isUpdating={updatingGuestId === guest.id}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 px-6 bg-black/20 rounded-xl border border-white/10">
                            <XCircle className="mx-auto text-gray-500" size={48} />
                            <h3 className="mt-4 text-xl font-semibold text-white">Aucun invité ne correspond à votre recherche</h3>
                            <p className="mt-2 text-gray-400">Veuillez ajuster vos filtres ou votre terme de recherche.</p>
                        </div>
                    )}
                </main>

                <footer className="text-center mt-12 text-gray-500 text-xs">
                    <p>Application d'accueil - Mariage Roxane & Chris Emmanuel</p>
                    <p className="mt-1">ID de session: <span className="font-mono bg-gray-800 px-2 py-1 rounded">{appId}</span></p>
                </footer>
            </div>
        </div>
    );
}
