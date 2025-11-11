/* eslint-disable no-console */
import config from '../config';
import { defaultUserImage, ROLE } from '../modules/Auth/auth.constant';
import Auth from '../modules/Auth/auth.model';


const adminData = {
  fullName: config.super_admin.fullName,
  role: ROLE.SUPER_ADMIN,
  email: config.super_admin.email,
  password: config.super_admin.password,
  image: config.super_admin.image || defaultUserImage,
  otp: config.super_admin.otp,
  otpExpiry: new Date(),
  isVerifiedByOTP: true,
};

const seedingAdmin = async () => {
  try {
    const admin = await Auth.findOne({
      role: ROLE.SUPER_ADMIN,
      email: config.super_admin.email,
    });

    if (!admin) {
      await Auth.create(adminData);
      
      console.log('🎉✅ Super admin seeded successfully!');
    } else {
      console.log('🟡⚠️ Super admin already exists!');
    }
  } catch (error) {
    console.log('🔴❌ Error seeding super admin', error);
  }
};

export default seedingAdmin;
