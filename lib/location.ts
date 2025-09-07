import { getPrisma } from "@/lib/db"

export interface LocationData {
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
}

export interface UserLocationRecord {
  id: string
  userId: string
  workspaceId: string
  latitude: number
  longitude: number
  accuracy?: number
  address?: string
  ipAddress?: string
  userAgent?: string
  locationSource: string
  distanceFromOffice?: number
  createdAt: Date
}

/**
 * Calculate distance between two coordinates using Haversine formula
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Earth's radius in kilometers
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180)
}

/**
 * Save user location to database
 */
export async function saveUserLocation({
  userId,
  workspaceId,
  location,
  ipAddress,
  userAgent,
  locationSource = 'login',
  isRequired = true
}: {
  userId: string
  workspaceId: string
  location: LocationData
  ipAddress?: string
  userAgent?: string
  locationSource?: string
  isRequired?: boolean
}) {
  const prisma = await getPrisma()

  // Get workspace office location to calculate distance
  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: { 
      officeLatitude: true, 
      officeLongitude: true,
      locationTrackingEnabled: true,
      name: true
    }
  })

  // For mandatory location tracking, always save regardless of workspace settings
  if (!isRequired && !workspace?.locationTrackingEnabled) {
    throw new Error("Location tracking is not enabled for this workspace")
  }

  let distanceFromOffice: number | undefined

  if (workspace?.officeLatitude && workspace?.officeLongitude) {
    distanceFromOffice = calculateDistance(
      Number(location.latitude),
      Number(location.longitude),
      Number(workspace.officeLatitude),
      Number(workspace.officeLongitude)
    )
  }

  const locationRecord = await prisma.userLocation.create({
    data: {
      userId,
      workspaceId,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      address: location.address,
      ipAddress,
      userAgent,
      locationSource,
      distanceFromOffice,
    }
  })

  return locationRecord
}

/**
 * Get user location history
 */
export async function getUserLocationHistory(
  workspaceId: string,
  userId?: string,
  options: {
    page?: number
    pageSize?: number
    startDate?: Date
    endDate?: Date
    locationSource?: string
  } = {}
) {
  const prisma = await getPrisma()
  const {
    page = 1,
    pageSize = 50,
    startDate,
    endDate,
    locationSource
  } = options

  const where: any = { workspaceId }
  if (userId) where.userId = userId
  if (locationSource) where.locationSource = locationSource
  if (startDate || endDate) {
    where.createdAt = {}
    if (startDate) where.createdAt.gte = startDate
    if (endDate) where.createdAt.lte = endDate
  }

  const [items, total] = await Promise.all([
    prisma.userLocation.findMany({
      where,
      include: {
        user: {
          select: { id: true, name: true, email: true }
        }
      },
      orderBy: { createdAt: "desc" },
      take: pageSize,
      skip: (page - 1) * pageSize,
    }),
    prisma.userLocation.count({ where })
  ])

  return { items, total, page, pageSize }
}

/**
 * Get current locations of all workspace members
 */
export async function getWorkspaceCurrentLocations(workspaceId: string) {
  const prisma = await getPrisma()

  // Get the most recent location for each user in the workspace
  const locations = await prisma.userLocation.findMany({
    where: {
      workspaceId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Last 24 hours
      }
    },
    include: {
      user: {
        select: { id: true, name: true, email: true }
      }
    },
    orderBy: { createdAt: "desc" }
  })

  // Group by user and get the most recent location for each
  const userLocations = new Map()
  locations.forEach(location => {
    if (!userLocations.has(location.userId)) {
      userLocations.set(location.userId, location)
    }
  })

  return Array.from(userLocations.values())
}

/**
 * Update workspace office location
 */
export async function updateWorkspaceOfficeLocation(
  workspaceId: string,
  location: LocationData & { address?: string },
  trackingEnabled: boolean = true
) {
  const prisma = await getPrisma()

  const workspace = await prisma.workspace.update({
    where: { id: workspaceId },
    data: {
      officeLatitude: location.latitude,
      officeLongitude: location.longitude,
      officeAddress: location.address,
      locationTrackingEnabled: trackingEnabled,
    }
  })

  return workspace
}

/**
 * Get workspace location settings
 */
export async function getWorkspaceLocationSettings(workspaceId: string) {
  const prisma = await getPrisma()

  const workspace = await prisma.workspace.findUnique({
    where: { id: workspaceId },
    select: {
      id: true,
      name: true,
      officeLatitude: true,
      officeLongitude: true,
      officeAddress: true,
      locationTrackingEnabled: true,
    }
  })

  return workspace
}

/**
 * Reverse geocode coordinates to address (placeholder - integrate with actual service)
 */
export async function reverseGeocode(lat: number, lng: number): Promise<string | null> {
  try {
    // In production, integrate with Google Maps, OpenStreetMap, or similar service
    // For now, return a placeholder
    return `Location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`
  } catch (error) {
    console.error("Reverse geocoding failed:", error)
    return null
  }
}