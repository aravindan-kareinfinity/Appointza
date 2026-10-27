import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { COLORS } from '../../theme';

export type GoogleUser = {
  name: string;
  email: string;
  photoUrl?: string | null;
};

type GoogleSignInButtonProps = {
  user: GoogleUser | null;
  isSigningIn: boolean;
  onSignIn: () => void;
  onSignOut: () => void;
};

export function GoogleSignInButton({
  user,
  isSigningIn,
  onSignIn,
  onSignOut,
}: GoogleSignInButtonProps) {

  if (user) {
    return (
      <View style={styles.userCard}>
        {user.photoUrl && (
          <Image source={{ uri: user.photoUrl }} style={styles.avatar} />
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userEmail}>{user.email}</Text>
        </View>
        <TouchableOpacity
          style={styles.signOutBtn}
          onPress={onSignOut}
          activeOpacity={0.8}
        >
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.signInBtn}
      onPress={onSignIn}
      disabled={isSigningIn}
      activeOpacity={0.8}
    >
      <Text style={styles.signInText}>
        {isSigningIn ? 'Signing in...' : 'Sign In with Google'}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  signInBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  signInText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  userName: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
  },
  userEmail: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  signOutBtn: {
    backgroundColor: COLORS.alarm,
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginLeft: 8,
  },
  signOutText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
});
