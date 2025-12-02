import React, { useState } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { searchUsers } from '../api/auth';
import { User } from '../types';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

export default function SearchScreen() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<User[]>([]);
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    const handleSearch = async () => {
        if (!query.trim()) return;
        setLoading(true);
        try {
            const users = await searchUsers(query);
            setResults(users);
        } catch (error) {
            console.error(error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item }: { item: User }) => (
        <TouchableOpacity
            style={styles.item}
            onPress={() => navigation.navigate('Profile', { user: item })}
        >
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>{item.nickname.charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.info}>
                <Text style={styles.name}>{item.name} {item.surname}</Text>
                <Text style={styles.nickname}>@{item.nickname}</Text>
            </View>
        </TouchableOpacity>
    );

    return (
        <View style={styles.container}>
            <View style={styles.searchContainer}>
                <TextInput
                    style={styles.input}
                    placeholder="Search users..."
                    value={query}
                    onChangeText={setQuery}
                    onSubmitEditing={handleSearch}
                    returnKeyType="search"
                />
                <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
                    <Text style={styles.searchButtonText}>Search</Text>
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" style={styles.loader} />
            ) : (
                <FlatList
                    data={results}
                    renderItem={renderItem}
                    keyExtractor={(item) => item.user_id}
                    ListEmptyComponent={
                        query && !loading ? <Text style={styles.empty}>No users found.</Text> : null
                    }
                />
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    searchContainer: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#eee',
        alignItems: 'center',
    },
    input: {
        flex: 1,
        height: 40,
        borderWidth: 1,
        borderColor: '#ddd',
        borderRadius: 20,
        paddingHorizontal: 15,
        backgroundColor: '#f9f9f9',
    },
    searchButton: {
        marginLeft: 10,
        paddingHorizontal: 15,
        paddingVertical: 10,
        backgroundColor: '#007bff',
        borderRadius: 20,
    },
    searchButtonText: {
        color: 'white',
        fontWeight: 'bold',
    },
    loader: {
        marginTop: 20,
    },
    item: {
        flexDirection: 'row',
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: '#f0f0f0',
        alignItems: 'center',
    },
    avatar: {
        width: 50,
        height: 50,
        borderRadius: 25,
        backgroundColor: '#007bff',
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 15,
    },
    avatarText: {
        color: 'white',
        fontSize: 20,
        fontWeight: 'bold',
    },
    info: {
        flex: 1,
    },
    name: {
        fontWeight: 'bold',
        fontSize: 16,
        color: '#333',
    },
    nickname: {
        color: '#666',
        fontSize: 14,
    },
    empty: {
        textAlign: 'center',
        marginTop: 30,
        color: '#999',
    },
});
