const ModelUser = require("../models/ModelUser");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const path = require("path");

module.exports = {
  createUser: async (req, res) => {
    try {
      const {
        nip,
        nik,
        nama,
        jenisKelamin,
        tempatLahir,
        tanggalLahir,
        telpon,
        agama,
        statusNikah,
        alamat,
        jabatan,
      } = req.body;
      if (nip === "")
        return res
          .status(400)
          .json({ message: "NIP tidak boleh kosong!", error: "nip" });
      if (nik === "")
        return res
          .status(400)
          .json({ message: "NIK tidak boleh kosong!", error: "nik" });
      if (nama === "")
        return res
          .status(400)
          .json({ message: "Nama tidak boleh kosong!", error: "nama" });
      if (jenisKelamin === "")
        return res
          .status(400)
          .json({ message: "Pilih Jenis Kelamin!", error: "jenisKelamin" });
      if (tempatLahir === "")
        return res.status(400).json({
          message: "Tempat Lahir tidak boleh kosong!",
          error: "tempatLahir",
        });
      if (tanggalLahir === "")
        return res.status(400).json({
          message: "Tanggal Lahir tidak boleh kosong!",
          error: "tanggalLahir",
        });
      if (telpon === "")
        return res.status(400).json({
          message: "No telpon tidak boleh kosong!",
          error: "tanggalLahir",
        });
      if (agama === "")
        return res.status(400).json({
          message: "Agama tidak boleh kosong!",
          error: "agama",
        });
      if (statusNikah === "")
        return res.status(400).json({
          message: "Status nikah tidak boleh kosong!",
          error: "statusNikah",
        });
      if (alamat === "")
        return res.status(400).json({
          message: "Alamat tidak boleh kosong!",
          error: "alamat",
        });
      if (jabatan === "")
        return res.status(400).json({
          message: "Jabatan tidak boleh kosong!",
          error: "jabatan",
        });

      const checkNip = await ModelUser.findAll({ where: { nip: nip } });

      if (checkNip[0])
        return res
          .status(400)
          .json({ message: "NIP sudah terdaftar!", error: "nip" });

      const checkNik = await ModelUser.findAll({ where: { nik: nik } });
      if (checkNik[0])
        return res
          .status(400)
          .json({ message: "NIK Sudah terdaftar!", error: "nik" });

      if (req.files === null)
        return res
          .status(400)
          .json({ message: "No File Upload!", error: "foto" });
      const file = req.files.file;
      const filesize = file.data.length;
      const ext = path.extname(file.name);
      const filename = Date.now() + ext;
      const url = `${req.protocol}://${req.get(
        "host"
      )}/public/images/${filename}`;
      const allowedType = [".png", ".jpg", ".jpeg"];
      if (!allowedType.includes(ext.toLowerCase()))
        return res.status(422).json({
          message: "Foto harus berupa png,jpg atau jpeg!",
          error: "foto",
        });
      if (filesize > 3000000)
        return res
          .status(422)
          .json({ message: "Foto harus di bawah 3 mb!", error: "foto" });
      file.mv(`./public/images/${filename}`, async (err) => {
        if (err) return res.status(500).json({ message: err.message });
        const salt = await bcrypt.genSalt();
        const hashPassword = await bcrypt.hash(nip, salt);

        await ModelUser.create({
          nip: nip,
          nik: nik,
          nama: nama,
          jenis_kelamin: jenisKelamin,
          tempat_lahir: tempatLahir,
          tanggal_lahir: tanggalLahir,
          telpon: telpon,
          agama: agama,
          status_nikah: statusNikah,
          alamat: alamat,
          jabatan: jabatan,
          foto: filename,
          url: url,
          password: hashPassword,
        });

        return res.status(201).json({ message: "Data berhasil di simpan!" });
      });
    } catch (error) {
      return res.status(500).json({ error });
    }
  },
  loginUser: async (req, res) => {
    try {
      const { username, password } = req.body;
      if (username === "")
        return res
          .status(400)
          .json({ message: "Username tidak boleh kosong!", error: "username" });
      if (password === "")
        return res
          .status(400)
          .json({ message: "Password tidak boleh kosong!", error: "password" });

      const checkUsername = await ModelUser.findAll({
        where: {
          nip: username,
        },
      });

      if (!checkUsername[0])
        return res
          .status(400)
          .json({ message: "Akun anda tidak terdaftar!", error: "username" });

      const match = await bcrypt.compare(password, checkUsername[0].password);

      if (!match)
        return res
          .status(400)
          .json({ message: "Password anda salah!", error: "password" });
      const userId = checkUsername[0].id_user;
      const nik = checkUsername[0].nik;

      const token = jwt.sign({ userId, nik }, process.env.ACCESS_TOKEN, {
        expiresIn: "1d",
      });

      await ModelUser.update(
        {
          token: token,
        },
        {
          where: {
            id_user: userId,
          },
        }
      );

      res.cookie("token", token, {
        httpOnly: true,
        maxAge: 24 * 60 * 60 * 1000,
      });

      const data = {
        userId: userId,
      };

      return res.status(200).json({ token, data });
    } catch (error) {
      return res.status(500).json({ error });
    }
  },
  removeToken: async (req, res) => {
    try {
      await ModelUser.update(
        {
          token: null,
        },
        {
          where: {
            id_user: req.params.id,
          },
        }
      );

      res.clearCookie("token");

      return res.sendStatus(200);
    } catch (error) {
      return res.status(500).json({ error });
    }
  },
};
