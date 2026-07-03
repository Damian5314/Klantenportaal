import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { ApiError } from "@/utils/apiError";
import {
  AccessTokenPayload,
  generateRefreshTokenValue,
  refreshTokenExpiryDate,
  signAccessToken,
} from "@/utils/tokens";

async function buildAccessTokenPayload(userId: string): Promise<AccessTokenPayload> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { include: { permissions: true } } },
  });
  if (!user || !user.isActive) throw ApiError.unauthorized("Account is not active");
  return {
    sub: user.id,
    email: user.email,
    roleId: user.roleId,
    roleName: user.role.name,
    permissions: user.role.permissions.map((p) => p.key),
    kind: user.kind,
  };
}

export async function login(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.isActive) throw ApiError.unauthorized("Ongeldige inloggegevens");

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw ApiError.unauthorized("Ongeldige inloggegevens");

  const payload = await buildAccessTokenPayload(user.id);
  const accessToken = signAccessToken(payload);
  const refreshTokenValue = generateRefreshTokenValue();

  await prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  return {
    accessToken,
    refreshToken: refreshTokenValue,
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      kind: user.kind,
      roleName: payload.roleName,
      permissions: payload.permissions,
    },
  };
}

export async function refresh(tokenValue: string) {
  const existing = await prisma.refreshToken.findUnique({ where: { token: tokenValue } });
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    throw ApiError.unauthorized("Refresh token is ongeldig of verlopen");
  }

  // rotate: revoke old, issue new
  await prisma.refreshToken.update({
    where: { id: existing.id },
    data: { revokedAt: new Date() },
  });

  const payload = await buildAccessTokenPayload(existing.userId);
  const accessToken = signAccessToken(payload);
  const newRefreshTokenValue = generateRefreshTokenValue();

  await prisma.refreshToken.create({
    data: {
      token: newRefreshTokenValue,
      userId: existing.userId,
      expiresAt: refreshTokenExpiryDate(),
    },
  });

  return { accessToken, refreshToken: newRefreshTokenValue };
}

export async function logout(tokenValue: string) {
  await prisma.refreshToken.updateMany({
    where: { token: tokenValue, revokedAt: null },
    data: { revokedAt: new Date() },
  });
}

export async function getCurrentUser(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: { role: { include: { permissions: true } }, contact: { include: { company: true } } },
  });
  if (!user) throw ApiError.notFound("Gebruiker niet gevonden");
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    avatarUrl: user.avatarUrl,
    kind: user.kind,
    department: user.department,
    jobTitle: user.jobTitle,
    roleName: user.role.name,
    permissions: user.role.permissions.map((p) => p.key),
    contact: user.contact
      ? { id: user.contact.id, name: user.contact.name, company: user.contact.company }
      : null,
  };
}

export async function changePassword(userId: string, currentPassword: string, newPassword: string) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw ApiError.notFound("Gebruiker niet gevonden");
  const valid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!valid) throw ApiError.badRequest("Huidig wachtwoord is onjuist");
  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.user.update({ where: { id: userId }, data: { passwordHash } });
}
