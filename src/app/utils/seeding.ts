import config from '../config';
import { defaultUserImage, ROLE } from '../modules/Auth/auth.constant';
import Auth from '../modules/Auth/auth.model';

const seedingAdmin = async () => {
  try {
    const admin = await Auth.findOne({
      role: ROLE.SUPER_ADMIN,
      email: config.super_admin.email,
    });

    if (!admin) {
      await Auth.create({
        fullName: config.super_admin.fullName,
        role: ROLE.SUPER_ADMIN,
        email: config.super_admin.email,
        password: config.super_admin.password,
        image: config.super_admin.image || defaultUserImage,
        otp: config.super_admin.otp,
        otpExpiry: new Date(),
        isVerifiedByOTP: true,
      });
    }
  } catch (error) {
    // eslint-disable-next-line no-console
    console.log('Error seeding super admin', error);
  }
};

export default seedingAdmin;
